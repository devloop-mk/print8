import {
  FIRST_ORDER_BONUS_POINTS,
  LOYALTY_MAX_REDEEM_FRACTION,
  LOYALTY_POINT_MKDISCOUNT_VALUE,
  LOYALTY_POINTS_PER_100_MKD,
} from '@/lib/loyalty/constants';

export function normalizeCustomerEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Earn rule: 5 points per 100 MKD spent (floor). */
export function calculateEarnedPoints(cashAmountMkd: number): number {
  if (!Number.isFinite(cashAmountMkd) || cashAmountMkd <= 0) return 0;
  return Math.floor(cashAmountMkd / 100) * LOYALTY_POINTS_PER_100_MKD;
}

export function getFirstOrderBonusPoints(): number {
  return FIRST_ORDER_BONUS_POINTS;
}

/** Points a customer will earn from this order (preview + reserve). */
export function quoteOrderPointsEarn(input: {
  cashPaidMkd: number;
  firstOrderBonusEligible: boolean;
}): { earned: number; bonus: number; total: number } {
  const earned = calculateEarnedPoints(input.cashPaidMkd);
  const bonus = input.firstOrderBonusEligible ? getFirstOrderBonusPoints() : 0;
  return { earned, bonus, total: earned + bonus };
}

/** MKD discount from a points amount (generous redemption rate). */
export function pointsToDiscountMkd(points: number): number {
  if (!Number.isFinite(points) || points <= 0) return 0;
  return Math.floor(points * LOYALTY_POINT_MKDISCOUNT_VALUE);
}

/** Minimum points required to cover a given MKD discount. */
export function discountMkdToPoints(discountMkd: number): number {
  if (!Number.isFinite(discountMkd) || discountMkd <= 0) return 0;
  return Math.ceil(discountMkd / LOYALTY_POINT_MKDISCOUNT_VALUE);
}

export type PointsRedemptionQuote = {
  pointsRequested: number;
  pointsCharged: number;
  discountMkd: number;
  remainingBalance: number;
};

/**
 * Server-side redemption quote. Never trust client discount math.
 * Caps discount at subtotal and uses only the points actually needed.
 */
export function quotePointsRedemption(input: {
  pointsBalance: number;
  pointsRequested: number;
  subtotalAfterCouponMkd: number;
}): PointsRedemptionQuote | { error: 'insufficient_points' | 'invalid_amount' } {
  const pointsRequested = Math.floor(input.pointsRequested);
  if (pointsRequested <= 0) {
    return {
      pointsRequested: 0,
      pointsCharged: 0,
      discountMkd: 0,
      remainingBalance: input.pointsBalance,
    };
  }

  if (pointsRequested > input.pointsBalance) {
    return { error: 'insufficient_points' };
  }

  const maxRedeemableMkd = Math.max(
    0,
    Math.floor(input.subtotalAfterCouponMkd * LOYALTY_MAX_REDEEM_FRACTION),
  );
  if (maxRedeemableMkd <= 0) {
    return {
      pointsRequested,
      pointsCharged: 0,
      discountMkd: 0,
      remainingBalance: input.pointsBalance,
    };
  }

  const discountFromPoints = pointsToDiscountMkd(pointsRequested);
  const discountMkd = Math.min(maxRedeemableMkd, discountFromPoints);
  const pointsCharged = discountMkdToPoints(discountMkd);

  if (pointsCharged > input.pointsBalance) {
    return { error: 'insufficient_points' };
  }

  return {
    pointsRequested,
    pointsCharged,
    discountMkd,
    remainingBalance: input.pointsBalance - pointsCharged,
  };
}
