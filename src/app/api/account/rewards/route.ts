import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/auth/customer';
import { isCouponExpired } from '@/lib/coupons/coupon-lifecycle';
import {
  countCouponRedemptions,
  getCouponById,
  listIssuedRewardCouponsForEmail,
} from '@/lib/db/coupons';
import { findSpinPlayByEmail } from '@/lib/rewards/spin-play';
import { SPIN_COUPON_VALID_DAYS } from '@/lib/rewards/spin-config';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.customer.email;

    const [play, coupons] = await Promise.all([
      findSpinPlayByEmail(email),
      listIssuedRewardCouponsForEmail(email),
    ]);

    let spinReward: {
      prizeKey: string;
      discountAmount: number;
      minOrderAmount: number | null;
      couponCode: string | null;
      redeemed: boolean;
      endsAt: string | null;
      validDays: number;
      createdAt: string;
    } | null = null;

    if (play) {
      let minOrderAmount: number | null = null;
      let redeemed = false;
      let endsAt: string | null = null;

      if (play.couponId) {
        const coupon = await getCouponById(play.couponId);
        if (coupon) {
          minOrderAmount = coupon.minOrderAmount;
          endsAt = coupon.endsAt;
          const used = await countCouponRedemptions(coupon.id);
          redeemed =
            coupon.maxRedemptionsTotal != null &&
            used >= coupon.maxRedemptionsTotal;
        }
      }

      const spinExpiredUnused = !redeemed && isCouponExpired(endsAt);

      if (!spinExpiredUnused) {
        spinReward = {
          prizeKey: play.prizeKey,
          discountAmount: play.discountAmount,
          minOrderAmount,
          couponCode: play.couponCode,
          redeemed,
          endsAt,
          validDays: SPIN_COUPON_VALID_DAYS,
          createdAt: play.createdAt,
        };
      }
    }

    const mappedCoupons = coupons.map((coupon) => ({
      code: coupon.code,
      discountAmount: coupon.discountAmount,
      minOrderAmount: coupon.minOrderAmount,
      redeemed: coupon.redeemed,
      endsAt: coupon.endsAt,
      createdAt: coupon.createdAt,
    }));

    return NextResponse.json({
      spinReward,
      coupons: mappedCoupons.filter(
        (coupon) => coupon.redeemed || !isCouponExpired(coupon.endsAt),
      ),
    });
  } catch (error) {
    console.error('[account/rewards]', error);
    return NextResponse.json({ error: 'Failed to load rewards' }, { status: 500 });
  }
}
