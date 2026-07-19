import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { validateCouponForCheckout } from '@/lib/coupons/validate-coupon';

const schema = z.object({
  code: z.string().trim().min(2).max(40),
  subtotalAmount: z.number().positive().max(500_000),
  email: z.string().trim().email().max(254).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'coupon-validate', 30, 60 * 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: 'invalid_payload', error: 'Invalid coupon request' },
        { status: 400 },
      );
    }

    const result = await validateCouponForCheckout({
      code: parsed.data.code,
      subtotalAmount: parsed.data.subtotalAmount,
      customerEmail: parsed.data.email,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: result.code,
          error: result.message,
          minOrderAmount: result.minOrderAmount,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      code: result.coupon.code,
      discountAmount: result.discountAmount,
      minOrderAmount: result.coupon.minOrderAmount,
      totalAmount: result.totalAmount,
      endsAt: result.coupon.endsAt,
    });
  } catch (error) {
    console.error('[coupons/validate] failed', error);
    return NextResponse.json(
      { ok: false, code: 'server_error', error: 'Failed to validate coupon' },
      { status: 500 },
    );
  }
}
