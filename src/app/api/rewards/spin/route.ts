import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomerSession } from '@/lib/auth/customer';
import { issueSpinCoupon } from '@/lib/db/coupons';
import { sendSpinRewardEmail } from '@/lib/email/spin-reward-email';
import {
  SPIN_COUPON_VALID_DAYS,
  SPIN_SEGMENTS,
  getSpinSegmentIndex,
  type SpinPrizeKey,
} from '@/lib/rewards/spin-config';
import { hasValidSpinOrigin } from '@/lib/rewards/spin-origin';
import {
  createSpinClaimToken,
  verifySpinClaimToken,
} from '@/lib/rewards/spin-token';
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

const spinOnlySchema = z.object({
  locale: z.enum(['mk', 'en']).optional(),
  /** Honeypot — must stay empty */
  website: z.string().max(200).optional(),
});

const claimSchema = z.object({
  email: z.string().trim().email().max(254).optional(),
  claimToken: z.string().min(16).max(600),
  locale: z.enum(['mk', 'en']).optional(),
  /** Honeypot — must stay empty */
  website: z.string().max(200).optional(),
});

function pickWinningPrize() {
  let prize = pickWeightedSpinPrize();
  if (prize.discountAmount <= 0 || prize.key === 'try_again') {
    prize =
      SPIN_SEGMENTS.find((s) => s.discountAmount > 0 && s.weight > 0) ??
      SPIN_SEGMENTS[0];
  }
  return prize;
}

function decoySpinResponse() {
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
    claimToken: null,
    validDays: SPIN_COUPON_VALID_DAYS,
  });
}

function spinResponse(prize: (typeof SPIN_SEGMENTS)[number], claimToken: string) {
  return NextResponse.json({
    ok: true,
    alreadyPlayed: false,
    prizeKey: prize.key,
    segmentIndex: getSpinSegmentIndex(prize.key),
    discountAmount: prize.discountAmount,
    minOrderAmount: prize.minOrderAmount,
    claimToken,
    validDays: SPIN_COUPON_VALID_DAYS,
  });
}

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

    const ip = getClientIp(request);
    const ua = request.headers.get('user-agent') || '';
    const ipHash = hashSpinFingerprint(ip);
    const userAgentHash = hashSpinFingerprint(ua);
    const session = await getCustomerSession();

    const raw = body as Record<string, unknown>;
    const isClaim = typeof raw.claimToken === 'string' && raw.claimToken.length > 0;

    if (isClaim) {
      const parsed = claimSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid data', code: 'invalid_data' },
          { status: 400 },
        );
      }

      const { claimToken, website } = parsed.data;
      const locale = parsed.data.locale === 'en' ? 'en' : 'mk';

      if (website && website.length > 0) {
        return NextResponse.json({
          ok: true,
          alreadyPlayed: false,
          couponCode: null,
          emailSent: false,
        });
      }

      const claimEmail = session
        ? normalizeSpinEmail(session.customer.email)
        : parsed.data.email
          ? normalizeSpinEmail(parsed.data.email)
          : null;

      if (!claimEmail) {
        return NextResponse.json(
          { error: 'Email required', code: 'email_required' },
          { status: 400 },
        );
      }

      const payload = verifySpinClaimToken(claimToken, ipHash);
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid or expired spin', code: 'invalid_token' },
          { status: 400 },
        );
      }

      const emailNormalized = claimEmail;
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

      const prizeKey = payload.prizeKey as SpinPrizeKey;
      const prize =
        SPIN_SEGMENTS.find((s) => s.key === prizeKey) ?? pickWinningPrize();

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
    }

    const parsed = spinOnlySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', code: 'invalid_data' },
        { status: 400 },
      );
    }

    const { website } = parsed.data;

    if (website && website.length > 0) {
      return decoySpinResponse();
    }

    if (session) {
      const existing = await findSpinPlayByEmail(
        normalizeSpinEmail(session.customer.email),
      );
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
    }

    const prize = pickWinningPrize();
    const claimToken = createSpinClaimToken({
      prizeKey: prize.key,
      discountAmount: prize.discountAmount,
      minOrderAmount: prize.minOrderAmount,
      ipHash,
    });

    return spinResponse(prize, claimToken);
  } catch (error) {
    console.error('[spin] unexpected', error);
    return NextResponse.json(
      { error: 'Server error', code: 'server_error' },
      { status: 500 },
    );
  }
}
