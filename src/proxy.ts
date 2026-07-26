import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth';
import { getSiteUrl } from '@/lib/seo/site';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/server-auth';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const LOGIN_PATHS = new Set(['/admin/login', '/api/admin/login']);

function isAuthCallbackPath(pathname: string): boolean {
  return pathname === '/auth/callback' || pathname.endsWith('/auth/callback');
}

function redirectToCanonicalHost(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV === 'development') return null;

  const canonical = getSiteUrl();
  const canonicalHost = new URL(canonical).host;
  const currentHost =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ??
    request.nextUrl.host;

  if (!currentHost || currentHost === canonicalHost) return null;

  const normalizedCurrent = currentHost.replace(/^www\./, '');
  const normalizedCanonical = canonicalHost.replace(/^www\./, '');
  if (normalizedCurrent !== normalizedCanonical) return null;

  const target = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    canonical,
  );
  return NextResponse.redirect(target, 308);
}

function redirectAuthTokensToCallback(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;

  if (
    isAuthCallbackPath(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin')
  ) {
    return null;
  }

  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  if (!code && !tokenHash) return null;

  const callback = new URL('/auth/callback', request.url);
  searchParams.forEach((value, key) => {
    callback.searchParams.set(key, value);
  });

  if (
    searchParams.get('type') === 'signup' &&
    !callback.searchParams.has('auth')
  ) {
    callback.searchParams.set('auth', 'signup');
  }

  return NextResponse.redirect(callback);
}

async function refreshSupabaseSession(
  request: NextRequest,
  response: NextResponse,
) {
  try {
    const supabase = createSupabaseMiddlewareClient(request, response);
    await supabase.auth.getUser();
  } catch {
    // Supabase auth not configured in this environment.
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminArea =
    pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminArea && !LOGIN_PATHS.has(pathname)) {
    const session = await verifyAdminSessionToken(
      request.cookies.get(ADMIN_COOKIE_NAME)?.value,
    );

    if (!session) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('from', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next({ request });
    await refreshSupabaseSession(request, response);
    return response;
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const response = NextResponse.next({ request });
    await refreshSupabaseSession(request, response);
    return response;
  }

  const canonicalRedirect = redirectToCanonicalHost(request);
  if (canonicalRedirect) {
    return canonicalRedirect;
  }

  // Auth callback and API routes live outside `[locale]` — skip locale redirects.
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/')) {
    const response = NextResponse.next({ request });
    await refreshSupabaseSession(request, response);
    return response;
  }

  const authCallbackRedirect = redirectAuthTokensToCallback(request);
  if (authCallbackRedirect) {
    await refreshSupabaseSession(request, authCallbackRedirect);
    return authCallbackRedirect;
  }

  const response = intlMiddleware(request);
  await refreshSupabaseSession(request, response);
  return response;
}

export const config = {
  matcher: [
    '/',
    '/(mk|en)/:path*',
    '/((?!api|_next|_vercel|admin|auth|.*\\..*).*)',
    '/auth/:path*',
    '/api/:path*',
    '/admin/:path*',
  ],
};
