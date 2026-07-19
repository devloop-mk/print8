import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { issueSpinCoupon } from '@/lib/db/coupons';
import { sendSpinRewardEmail } from '@/lib/email/spin-reward-email';
import {
  SPIN_COUPON_VALID_DAYS,
  SPIN_SEGMENTS,
  getSpinSegmentIndex,
} from '@/lib/rewards/spin-config';
import { hasValidSpinOrigin } from '@/lib/rewards/spin-origin';
import {
  findSpinPlayByEmail,
  hashSpinFingerprint,
  insertSpinPlay,
  normalizeSpinEmail,
  pickWeightedSpinPrize,
  updateSpinPlayCoupon,
} from '@/lib/rewards/spin-play';
import { enforceRateLimit, getClientIp } from '@/lib/security/rate-limit';

const MAX_BODY_BYTES = 4_000;

const spinBodySchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(['mk', 'en']).optional(),
  /** Honeypot — must stay empty */
  website: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'rewards-spin', 8, 60 * 60 * 1000);
  if (rateLimited) return rateLimited;

  if (!hasValidSpinOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden', code: 'bad_origin' }, { status: 403 });
  }

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

    const parsed = spinBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', code: 'invalid_data' },
        { status: 400 },
      );
    }

    const { email, website } = parsed.data;
    const locale = parsed.data.locale === 'en' ? 'en' : 'mk';

    // Honeypot: pretend a win without writing DB or minting a coupon.
    if (website && website.length > 0) {
      const decoy =
        SPIN_SEGMENTS.find((s) => s.discountAmount > 0 && s.weight > 0) ??
        SPIN_SEGMENTS[0];
      return NextResponse.json({
        ok: true,
        alreadyPlayed: false,
        prizeKey: decoy.key,
        segmentIndex: getSpinSegmentIndex(decoy.key),
        discountAmount: decoy.discountAmount,
        minOrderAmount: decoy.minOrderAmount,
        couponCode: null,
        emailSent: false,
      });
    }

    const emailNormalized = normalizeSpinEmail(email);
    const existing = await findSpinPlayByEmail(emailNormalized);
    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: 'already_played',
          code: 'already_played',
          alreadyPlayed: true,
        },
        { status: 409 },
      );
    }

    let prize = pickWeightedSpinPrize();
    // Never issue try-again / zero-discount — always a real coupon prize.
    if (prize.discountAmount <= 0 || prize.key === 'try_again') {
      prize =
        SPIN_SEGMENTS.find((s) => s.discountAmount > 0 && s.weight > 0) ??
        SPIN_SEGMENTS[0];
    }
    const ip = getClientIp(request);
    const ua = request.headers.get('user-agent') || '';
    const ipHash = hashSpinFingerprint(ip);
    const userAgentHash = hashSpinFingerprint(ua);

    // Claim the email slot first so races cannot mint two coupons.
    const { play, duplicate } = await insertSpinPlay({
      email: emailNormalized,
      prizeKey: prize.key,
      discountAmount: prize.discountAmount,
      couponId: null,
      couponCode: null,
      ipHash,
      userAgentHash,
      locale,
    });

    if (duplicate || !play) {
      return NextResponse.json(
        {
          ok: false,
          error: 'already_played',
          code: 'already_played',
          alreadyPlayed: true,
        },
        { status: 409 },
      );
    }

    let couponCode: string | null = null;
    let emailSent = false;

    if (prize.discountAmount > 0) {
      const coupon = await issueSpinCoupon({
        discountAmount: prize.discountAmount,
        minOrderAmount: prize.minOrderAmount,
        validDays: SPIN_COUPON_VALID_DAYS,
        email: emailNormalized,
      });
      couponCode = coupon.code;
      await updateSpinPlayCoupon({
        id: play.id,
        couponId: coupon.id,
        couponCode: coupon.code,
      });

      const mail = await sendSpinRewardEmail({
        to: emailNormalized,
        locale,
        code: coupon.code,
        discountAmount: prize.discountAmount,
        minOrderAmount: prize.minOrderAmount,
        validDays: SPIN_COUPON_VALID_DAYS,
      });
      emailSent = mail.ok;
      if (!mail.ok) {
        console.error('[spin] email failed', mail.error, play.id);
      }
    }

    return NextResponse.json({
      ok: true,
      alreadyPlayed: false,
      prizeKey: prize.key,
      segmentIndex: getSpinSegmentIndex(prize.key),
      discountAmount: prize.discountAmount,
      minOrderAmount: prize.minOrderAmount,
      couponCode,
      emailSent,
      validDays: SPIN_COUPON_VALID_DAYS,
    });
  } catch (error) {
    console.error('[spin] unexpected', error);
    return NextResponse.json(
      { error: 'Server error', code: 'server_error' },
      { status: 500 },
    );
  }
}
