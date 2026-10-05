export const FREE_DELIVERY_THRESHOLD_MKD = 3000;
export const CARGO_DELIVERY_FEE_MKD = 150;

export type DeliveryFulfillmentMethod = 'cargo' | 'pickup';

/** Cargo fee from merchandise subtotal (before coupon / points). Pickup is always free. */
export function getOrderDeliveryFeeMkd(input: {
  fulfillmentMethod: DeliveryFulfillmentMethod;
  merchandiseSubtotalMkd: number;
}): number {
  if (input.fulfillmentMethod !== 'cargo') return 0;
  if (input.merchandiseSubtotalMkd + 1e-9 >= FREE_DELIVERY_THRESHOLD_MKD) {
    return 0;
  }
  return CARGO_DELIVERY_FEE_MKD;
}

export function amountUntilFreeDeliveryMkd(
  merchandiseSubtotalMkd: number,
): number {
  return Math.max(0, FREE_DELIVERY_THRESHOLD_MKD - merchandiseSubtotalMkd);
}

export function freeDeliveryProgressPercent(
  merchandiseSubtotalMkd: number,
): number {
  if (FREE_DELIVERY_THRESHOLD_MKD <= 0) return 100;
  return Math.min(
    100,
    (merchandiseSubtotalMkd / FREE_DELIVERY_THRESHOLD_MKD) * 100,
  );
}
