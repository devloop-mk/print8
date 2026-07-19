import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { deleteCoupon, updateCoupon } from '@/lib/db/coupons';

const patchSchema = z.object({
  discountAmount: z.number().positive().max(100_000).optional(),
  minOrderAmount: z.number().min(0).max(500_000).optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  maxRedemptionsPerDay: z.number().int().positive().max(10_000).nullable().optional(),
  maxRedemptionsTotal: z.number().int().positive().max(1_000_000).nullable().optional(),
  active: z.boolean().optional(),
  note: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid coupon update', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const coupon = await updateCoupon(id, parsed.data);
    return NextResponse.json({ ok: true, coupon });
  } catch (err) {
    console.error('[admin/coupons] update failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update coupon' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const { id } = await params;
    await deleteCoupon(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/coupons] delete failed', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete coupon' },
      { status: 400 },
    );
  }
}
