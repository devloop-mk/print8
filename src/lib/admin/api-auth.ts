import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth';

function isUnsafeAdminMethod(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function hasValidAdminOrigin(request: NextRequest) {
  const host = request.headers.get('host');
  if (!host) return false;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  // Same-origin navigations / some clients omit Origin; require Sec-Fetch-Site.
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none') {
    return true;
  }

  // Non-browser clients (scripts) should send Origin explicitly.
  return false;
}

export async function getAdminSessionFromRequest(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function requireAdminApi(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return { session: null, error: unauthorizedResponse() };
  }

  if (isUnsafeAdminMethod(request.method) && !hasValidAdminOrigin(request)) {
    return { session: null, error: forbiddenResponse() };
  }

  return { session, error: null };
}
