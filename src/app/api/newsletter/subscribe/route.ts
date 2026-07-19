import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { subscribeToNewsletter } from '@/lib/db/newsletter';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const schema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(['mk', 'en']).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    'newsletter-subscribe',
    10,
    60 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid email', code: 'invalid_email' },
        { status: 400 },
      );
    }

    const result = await subscribeToNewsletter({
      email: parsed.data.email,
      locale: parsed.data.locale ?? null,
    });

    return NextResponse.json({
      ok: true,
      created: result.created,
    });
  } catch (error) {
    console.error('[newsletter] subscribe failed', error);
    return NextResponse.json(
      { error: 'Subscribe failed', code: 'subscribe_failed' },
      { status: 500 },
    );
  }
}
