import { NextResponse, type NextRequest } from 'next/server';
import {
  buildOAuthCallbackUrl,
  getRequestOrigin,
  OAUTH_NEXT_COOKIE,
  resolveLocaleFromOAuthPath,
  sanitizeOAuthNextPath,
} from '@/lib/auth/oauth';
import { routing } from '@/i18n/routing';
import { localePath } from '@/lib/seo/site';
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/server-auth';

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const nextParam = request.nextUrl.searchParams.get('next');
  const locale = nextParam
    ? resolveLocaleFromOAuthPath(nextParam)
    : routing.defaultLocale;
  const loginPath = localePath(locale, '/account/login');
  const safeNext = sanitizeOAuthNextPath(
    nextParam ?? localePath(locale, '/account'),
    locale,
  );
  const callbackUrl = buildOAuthCallbackUrl(origin);

  try {
    const supabase = await createSupabaseRouteHandlerClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: 'online',
          prompt: 'select_account',
        },
      },
    });

    if (error || !data.url) {
      console.error('[auth/oauth/google] signInWithOAuth failed:', error?.message);
      return NextResponse.redirect(
        new URL(`${loginPath}?oauth=failed&reason=start`, origin),
      );
    }

    const redirect = NextResponse.redirect(data.url);
    redirect.cookies.set(OAUTH_NEXT_COOKIE, safeNext, {
      path: '/',
      httpOnly: true,
      secure: origin.startsWith('https://'),
      sameSite: 'lax',
      maxAge: 60 * 10,
    });

    return redirect;
  } catch (unexpected) {
    console.error('[auth/oauth/google] unexpected error:', unexpected);
    return NextResponse.redirect(
      new URL(`${loginPath}?oauth=failed&reason=start`, origin),
    );
  }
}
