import { NextRequest, NextResponse } from 'next/server';
import { validateUploadToken } from '@/lib/upload';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    'upload-session-validate',
    60,
    15 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  try {
    const body = (await request.json()) as { token?: unknown };
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (!token) {
      return NextResponse.json({ valid: false });
    }

    const session = await validateUploadToken(token);
    const valid = Boolean(
      session && new Date(session.expiresAt).getTime() > Date.now(),
    );

    return NextResponse.json({ valid });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
