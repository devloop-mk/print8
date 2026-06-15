import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin/auth';

export async function getAdminSessionFromRequest(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function requireAdminApi(request: NextRequest) {
  const session = await getAdminSessionFromRequest(request);
  if (!session) {
    return { session: null, error: unauthorizedResponse() };
  }
  return { session, error: null };
}
