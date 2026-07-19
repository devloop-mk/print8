import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { unsubscribeByToken } from '@/lib/db/newsletter';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const schema = z.object({
  token: z.string().trim().min(16).max(80),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    'newsletter-unsubscribe',
    30,
    60 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid token', code: 'invalid_token' },
        { status: 400 },
      );
    }

    const ok = await unsubscribeByToken(parsed.data.token);
    return NextResponse.json({ ok });
  } catch (error) {
    console.error('[newsletter] unsubscribe failed', error);
    return NextResponse.json(
      { error: 'Unsubscribe failed', code: 'unsubscribe_failed' },
      { status: 500 },
    );
  }
}
