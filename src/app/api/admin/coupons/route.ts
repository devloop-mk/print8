import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import {
  createCoupon,
  listCoupons,
  listRewardTiers,
  upsertRewardTier,
  deleteRewardTier,
  countCouponRedemptions,
  countCouponRedemptionsToday,
} from '@/lib/db/coupons';

const createSchema = z.object({
  code: z.string().trim().min(3).max(40),
  discountAmount: z.number().positive().max(100_000),
  minOrderAmount: z.number().min(0).max(500_000).default(0),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  maxRedemptionsPerDay: z.number().int().positive().max(10_000).nullable().optional(),
  maxRedemptionsTotal: z.number().int().positive().max(1_000_000).nullable().optional(),
  active: z.boolean().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

const tierSchema = z.object({
  id: z.string().max(64).optional(),
  minSpend: z.number().positive().max(500_000),
  rewardAmount: z.number().positive().max(100_000),
  rewardMinOrderAmount: z.number().min(0).max(500_000).default(0),
  rewardValidDays: z.number().int().positive().max(730).default(60),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const [coupons, tiers] = await Promise.all([listCoupons(300), listRewardTiers()]);
    const withStats = await Promise.all(
      coupons.map(async (coupon) => ({
        ...coupon,
        redemptionsTotal: await countCouponRedemptions(coupon.id),
        redemptionsToday: await countCouponRedemptionsToday(coupon.id),
      })),
    );

    return NextResponse.json({ coupons: withStats, rewardTiers: tiers });
  } catch (err) {
    console.error('[admin/coupons] list failed', err);
    return NextResponse.json({ error: 'Failed to load coupons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const body = await request.json();
    const action = typeof body?.action === 'string' ? body.action : 'create_coupon';

    if (action === 'upsert_tier') {
      const parsed = tierSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid reward tier', details: parsed.error.flatten() },
          { status: 400 },
        );
      }
      const tier = await upsertRewardTier(parsed.data);
      return NextResponse.json({ ok: true, tier });
    }

    if (action === 'delete_tier') {
      const id = z.string().min(1).max(64).safeParse(body?.id);
      if (!id.success) {
        return NextResponse.json({ error: 'Invalid tier id' }, { status: 400 });
      }
      await deleteRewardTier(id.data);
      return NextResponse.json({ ok: true });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid coupon', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const coupon = await createCoupon({
      ...parsed.data,
      kind: 'public',
    });
    return NextResponse.json({ ok: true, coupon });
  } catch (err) {
    console.error('[admin/coupons] create failed', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to save coupon',
      },
      { status: 500 },
    );
  }
}
