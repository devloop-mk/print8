import { NextResponse, type NextRequest } from 'next/server';
import {
  buildLocalizedAccountPath,
  buildOAuthCallbackUrl,
  getRequestOrigin,
  OAUTH_NEXT_COOKIE,
  resolveLocaleFromOAuthPath,
  sanitizeOAuthNextPath,
} from '@/lib/auth/oauth';
import { routing } from '@/i18n/routing';
import { createSupabaseRouteClient } from '@/lib/supabase/server-auth';

export async function GET(request: NextRequest) {
  const origin = getRequestOrigin(request);
  const nextParam = request.nextUrl.searchParams.get('next');
  const locale = nextParam
    ? resolveLocaleFromOAuthPath(nextParam)
    : routing.defaultLocale;
  const loginPath = `/${locale}/account/login`;
  const safeNext = sanitizeOAuthNextPath(nextParam, locale);
  const callbackUrl = buildOAuthCallbackUrl(origin);

  const placeholder = NextResponse.redirect(new URL(loginPath, origin));
  const supabase = createSupabaseRouteClient(request, placeholder);

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

  placeholder.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });

  redirect.cookies.set(OAUTH_NEXT_COOKIE, safeNext, {
    path: '/',
    httpOnly: true,
    secure: origin.startsWith('https://'),
    sameSite: 'lax',
    maxAge: 60 * 10,
  });

  return redirect;
}
