import { NextResponse, type NextRequest } from 'next/server';
import {
  getRequestOrigin,
  OAUTH_NEXT_COOKIE,
  resolveLocaleFromOAuthPath,
  sanitizeOAuthNextPath,
} from '@/lib/auth/oauth';
import { customersDb } from '@/lib/db/customers';
import { createSupabaseRouteClient } from '@/lib/supabase/server-auth';

function oauthLoginRedirect(
  origin: string,
  locale: string,
  reason: string,
): NextResponse {
  return NextResponse.redirect(
    new URL(`/${locale}/account/login?oauth=failed&reason=${reason}`, origin),
  );
}

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const nextCookie = request.cookies.get(OAUTH_NEXT_COOKIE)?.value;
  const locale = resolveLocaleFromOAuthPath(
    nextCookie ?? nextParam ?? '/mk/account',
  );

  const providerError = searchParams.get('error');
  if (providerError) {
    console.error(
      '[auth/callback] OAuth provider error:',
      providerError,
      searchParams.get('error_description'),
    );
    return oauthLoginRedirect(origin, locale, 'provider');
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/${locale}/account/login?oauth=missing_code`, origin),
    );
  }

  const safeNext = sanitizeOAuthNextPath(nextCookie ?? nextParam, locale);
  let response = NextResponse.redirect(new URL(safeNext, origin));

  const supabase = createSupabaseRouteClient(request, response);
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const reason =
      error.message.toLowerCase().includes('flow state') ||
      error.message.toLowerCase().includes('code verifier')
        ? 'pkce'
        : 'exchange';
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message);
    return oauthLoginRedirect(origin, locale, reason);
  }

  response.cookies.delete(OAUTH_NEXT_COOKIE);

  const user = data.user;
  if (user?.id && user.email) {
    const metadata = user.user_metadata;
    const fullName =
      typeof metadata?.full_name === 'string'
        ? metadata.full_name
        : typeof metadata?.name === 'string'
          ? metadata.name
          : null;

    try {
      const customer = await customersDb.ensureProfile({
        id: user.id,
        email: user.email,
        fullName,
      });
      await customersDb.linkPastOrders(customer.id, customer.email);
    } catch (profileError) {
      console.error('[auth/callback] customer profile sync failed:', profileError);
    }
  }

  return response;
}
