import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/server-auth';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const LOGIN_PATHS = new Set(['/admin/login', '/api/admin/login']);

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

  const response = intlMiddleware(request);
  await refreshSupabaseSession(request, response);
  return response;
}

export const config = {
  matcher: [
    '/',
    '/(mk|en)/:path*',
    '/auth/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
