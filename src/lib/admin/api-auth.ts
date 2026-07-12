import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth';

function isUnsafeAdminMethod(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function hasValidAdminOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return true;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
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
