import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomerSession } from '@/lib/auth/customer';
import { quotePointsRedemption } from '@/lib/loyalty/points';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const previewSchema = z.object({
  subtotalAmount: z.number().min(0).max(1_000_000),
  couponDiscount: z.number().min(0).max(1_000_000).default(0),
  pointsToRedeem: z.number().int().min(0).max(1_000_000),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'loyalty-preview', 60, 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, code: 'auth_required' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = previewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, code: 'invalid_data' }, { status: 400 });
    }

    const subtotalAfterCoupon = Math.max(
      0,
      parsed.data.subtotalAmount - parsed.data.couponDiscount,
    );

    const quote = quotePointsRedemption({
      pointsBalance: session.customer.pointsBalance,
      pointsRequested: parsed.data.pointsToRedeem,
      subtotalAfterCouponMkd: subtotalAfterCoupon,
    });

    if ('error' in quote) {
      return NextResponse.json({ ok: false, code: quote.error });
    }

    return NextResponse.json({
      ok: true,
      pointsCharged: quote.pointsCharged,
      pointsDiscount: quote.discountMkd,
      remainingBalance: quote.remainingBalance,
      payableTotal: Math.max(0, subtotalAfterCoupon - quote.discountMkd),
    });
  } catch {
    return NextResponse.json({ ok: false, code: 'preview_failed' }, { status: 500 });
  }
}
