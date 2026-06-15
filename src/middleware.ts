import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const LOGIN_PATHS = new Set(['/admin/login', '/api/admin/login']);

export async function middleware(request: NextRequest) {
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
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(mk|en)/:path*', '/admin/:path*', '/api/admin/:path*'],
};
