import { customerEmailMatchesOrder } from '@/lib/auth/customer';
import type { CustomerRecord } from '@/lib/db/customers';
import { quotePointsRedemption } from '@/lib/loyalty/points';

export type ValidatedPointsRedemption = {
  pointsCharged: number;
  pointsDiscountAmount: number;
};

export function validatePointsRedemptionForCheckout(input: {
  customer: CustomerRecord | null;
  orderEmail: string;
  pointsToRedeem: number;
  subtotalAfterCouponMkd: number;
}):
  | { ok: true; redemption: ValidatedPointsRedemption }
  | { ok: false; code: string; message: string } {
  const pointsToRedeem = Math.floor(input.pointsToRedeem);
  if (pointsToRedeem <= 0) {
    return {
      ok: true,
      redemption: { pointsCharged: 0, pointsDiscountAmount: 0 },
    };
  }

  if (!input.customer) {
    return {
      ok: false,
      code: 'auth_required',
      message: 'Login required to use points',
    };
  }

  if (!customerEmailMatchesOrder(input.customer, input.orderEmail)) {
    return {
      ok: false,
      code: 'email_mismatch',
      message: 'Checkout email must match your account email',
    };
  }

  const quote = quotePointsRedemption({
    pointsBalance: input.customer.pointsBalance,
    pointsRequested: pointsToRedeem,
    subtotalAfterCouponMkd: input.subtotalAfterCouponMkd,
  });

  if ('error' in quote) {
    return {
      ok: false,
      code: quote.error,
      message: 'Not enough points',
    };
  }

  return {
    ok: true,
    redemption: {
      pointsCharged: quote.pointsCharged,
      pointsDiscountAmount: quote.discountMkd,
    },
  };
}
