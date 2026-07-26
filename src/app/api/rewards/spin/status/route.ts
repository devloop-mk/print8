import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth/customer';
import { countCouponRedemptions, getCouponById } from '@/lib/db/coupons';
import { findSpinPlayByEmail } from '@/lib/rewards/spin-play';
import { SPIN_COUPON_VALID_DAYS } from '@/lib/rewards/spin-config';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ loggedIn: false });
    }

    const play = await findSpinPlayByEmail(session.customer.email);
    if (!play) {
      return NextResponse.json({
        loggedIn: true,
        alreadyPlayed: false,
      });
    }

    let minOrderAmount: number | null = null;
    let couponRedeemed = false;
    let endsAt: string | null = null;

    if (play.couponId) {
      const coupon = await getCouponById(play.couponId);
      if (coupon) {
        minOrderAmount = coupon.minOrderAmount;
        endsAt = coupon.endsAt;
        const used = await countCouponRedemptions(coupon.id);
        couponRedeemed =
          coupon.maxRedemptionsTotal != null &&
          used >= coupon.maxRedemptionsTotal;
      }
    }

    return NextResponse.json({
      loggedIn: true,
      alreadyPlayed: true,
      play: {
        prizeKey: play.prizeKey,
        discountAmount: play.discountAmount,
        minOrderAmount,
        couponCode: play.couponCode,
        couponRedeemed,
        endsAt,
        validDays: SPIN_COUPON_VALID_DAYS,
        createdAt: play.createdAt,
      },
    });
  } catch (error) {
    console.error('[rewards/spin/status]', error);
    return NextResponse.json({ error: 'Failed to load spin status' }, { status: 500 });
  }
}
