import { NextResponse, type NextRequest } from 'next/server';
import { sanitizeOAuthNextPath } from '@/lib/auth/oauth';
import { routing, type Locale } from '@/i18n/routing';
import { createSupabaseRouteClient } from '@/lib/supabase/server-auth';

function resolveLocaleFromPath(path: string): Locale {
  const match = path.match(/^\/(mk|en)(\/|$)/);
  if (match && routing.locales.includes(match[1] as Locale)) {
    return match[1] as Locale;
  }
  return routing.defaultLocale;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');
  const locale = nextParam
    ? resolveLocaleFromPath(nextParam)
    : routing.defaultLocale;
  const loginPath = `/${locale}/account/login`;

  const providerError = searchParams.get('error');
  if (providerError) {
    console.error('[auth/callback] OAuth provider error:', providerError, searchParams.get('error_description'));
    return NextResponse.redirect(
      new URL(`${loginPath}?oauth=failed`, origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`${loginPath}?oauth=missing_code`, origin),
    );
  }

  const safeNext = sanitizeOAuthNextPath(nextParam, locale);
  let response = NextResponse.redirect(new URL(safeNext, origin));

  const supabase = createSupabaseRouteClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message);
    return NextResponse.redirect(
      new URL(`${loginPath}?oauth=failed`, origin),
    );
  }

  return response;
}
