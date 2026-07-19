import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { contactMessageSchema } from '@/lib/validations/contact';
import {
  hashClientIp,
  insertContactMessage,
} from '@/lib/db/contact-messages';
import { sendContactMessageEmail } from '@/lib/email/contact-email';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit';

const MAX_BODY_BYTES = 8_000;

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'contact', 5, 60 * 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Request too large', code: 'payload_too_large' },
        { status: 413 },
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = contactMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid contact data',
          code: 'invalid_contact_data',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { name, email, message, locale, website } = parsed.data;

    // Honeypot tripped — pretend success to avoid bot probing.
    if (website && website.length > 0) {
      return NextResponse.json({ ok: true });
    }

    const ipHash = hashClientIp(getClientIp(request));

    await insertContactMessage({
      name,
      email,
      message,
      locale: locale ?? null,
      ipHash,
    });

    try {
      await sendContactMessageEmail({ name, email, message, locale });
    } catch (emailError) {
      console.error('[contact] email delivery failed:', emailError);
      // Message is already saved — still return success to the visitor.
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const errorId = nanoid(8);
    console.error(`[contact] submit failed id=${errorId}`, err);
    return NextResponse.json(
      { error: 'Failed to send message', code: 'contact_failed', errorId },
      { status: 500 },
    );
  }
}
