import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { issueHolidayWorkshopCoupon } from '@/lib/db/coupons';
import {
  HOLIDAY_PRIZES,
  HOLIDAY_WORKSHOP_TARGET,
  HOLIDAY_WORKSHOP_VALID_DAYS,
  encodeHolidayWorkshopNote,
  isHolidayWorkshopSeason,
  pickHolidaySuggestion,
  type HolidayPrize,
  type HolidayProductKind,
} from '@/lib/holiday/workshop-config';
import { hasValidSpinOrigin } from '@/lib/rewards/spin-origin';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const MAX_BODY_BYTES = 2_000;
const PRODUCT_KINDS = [
  'mug',
  'tshirt',
  'calendar',
  'cards',
  'poster',
  'sticker',
  'gift',
] as const satisfies readonly HolidayProductKind[];

const schema = z.object({
  collected: z.number().int().min(HOLIDAY_WORKSHOP_TARGET).max(40),
  collectedKinds: z.array(z.enum(PRODUCT_KINDS)).max(40).optional(),
  locale: z.enum(['mk', 'en']).optional(),
  website: z.string().max(200).optional(),
});

function pickWeightedHolidayPrize(): HolidayPrize {
  const totalWeight = HOLIDAY_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  let ticket = randomInt(Math.max(1, totalWeight));
  for (const prize of HOLIDAY_PRIZES) {
    ticket -= prize.weight;
    if (ticket < 0) return prize;
  }
  return HOLIDAY_PRIZES[0];
}

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    'holiday-workshop-claim',
    24,
    24 * 60 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  if (!hasValidSpinOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden', code: 'bad_origin' }, { status: 403 });
  }

  if (!isHolidayWorkshopSeason()) {
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

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
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

    const prize = pickWeightedHolidayPrize();
    const suggestion = pickHolidaySuggestion(parsed.data.collectedKinds ?? []);
    const coupon = await issueHolidayWorkshopCoupon({
      discountAmount: prize.discountAmount,
      minOrderAmount: prize.minOrderAmount,
      validDays: HOLIDAY_WORKSHOP_VALID_DAYS,
      note: encodeHolidayWorkshopNote(prize, suggestion.id),
    });

    return NextResponse.json({
      ok: true,
      prizeKey: prize.key,
      kind: prize.kind,
      percent: prize.percent,
      discountAmount: prize.discountAmount,
      minOrderAmount: prize.minOrderAmount,
      golden: prize.golden,
      couponCode: coupon.code,
      validDays: HOLIDAY_WORKSHOP_VALID_DAYS,
      endsAt: coupon.endsAt,
      suggestionId: suggestion.id,
      suggestionHref: suggestion.href,
    });
  } catch (error) {
    console.error('[holiday-workshop] claim failed', error);
    return NextResponse.json(
      { error: 'Server error', code: 'server_error' },
      { status: 500 },
    );
  }
}
