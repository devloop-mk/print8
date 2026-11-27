import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { issueNyScratchCoupon } from '@/lib/db/coupons';
import { hasValidSpinOrigin } from '@/lib/rewards/spin-origin';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import {
  NY_SCRATCH_VALID_DAYS,
  encodeNyScratchNote,
  isNyScratchSeason,
  isValidNyScratchGrid,
  nyScratchCouponYear,
} from '@/lib/scratch/scratch-config';
import {
  generateNyScratchGrid,
  pickWeightedScratchPrize,
} from '@/lib/scratch/scratch-grid';

const MAX_BODY_BYTES = 1_200;

const schema = z.object({
  locale: z.enum(['mk', 'en']).optional(),
  website: z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    'ny-scratch-claim',
    4,
    24 * 60 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  if (!hasValidSpinOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden', code: 'bad_origin' }, { status: 403 });
  }

  if (!isNyScratchSeason()) {
    return NextResponse.json(
      { error: 'Season closed', code: 'season_closed' },
      { status: 403 },
    );
  }

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Request too large', code: 'payload_too_large' },
        { status: 413 },
      );
    }

    let body: unknown = {};
    if (rawBody.trim().length > 0) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', code: 'invalid_data' },
        { status: 400 },
      );
    }

    if (parsed.data.website && parsed.data.website.length > 0) {
      return NextResponse.json({ ok: true, couponCode: null });
    }

    const prize = pickWeightedScratchPrize();
    const grid = generateNyScratchGrid(prize.key);
    if (!isValidNyScratchGrid(grid, prize.key)) {
      throw new Error('Invalid New Year scratch grid');
    }

    const coupon = await issueNyScratchCoupon({
      year: nyScratchCouponYear(),
      discountAmount: prize.discountAmount,
      minOrderAmount: prize.minOrderAmount,
      validDays: NY_SCRATCH_VALID_DAYS,
      note: encodeNyScratchNote(prize),
    });

    return NextResponse.json({
      ok: true,
      grid,
      prizeKey: prize.key,
      kind: prize.kind,
      percent: prize.percent,
      productKind: prize.productKind,
      discountAmount: prize.discountAmount,
      minOrderAmount: prize.minOrderAmount,
      jackpot: prize.jackpot,
      href: prize.href,
      couponCode: coupon.code,
      validDays: NY_SCRATCH_VALID_DAYS,
      endsAt: coupon.endsAt,
    });
  } catch (error) {
    console.error('[ny-scratch] claim failed', error);
    return NextResponse.json(
      { error: 'Server error', code: 'server_error' },
      { status: 500 },
    );
  }
}
