/** Points earned per each full 100 MKD paid (cash) on a completed order. */
export const LOYALTY_POINTS_PER_100_MKD = 5;

/** One-time bonus when the customer's first order is marked delivered. */
export const FIRST_ORDER_BONUS_POINTS = 50;

/**
 * Redemption value: each point is worth this many MKD off at checkout.
 * Example: 400 points → 500 MKD discount (400 × 1.25).
 */
export const LOYALTY_POINT_MKDISCOUNT_VALUE = 1.25;

/** Maximum share of subtotal (after coupon) that can be paid with points (0–1). */
export const LOYALTY_MAX_REDEEM_FRACTION = 1;
