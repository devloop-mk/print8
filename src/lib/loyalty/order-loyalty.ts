import type { OrderRecord, OrderStatus } from '@/lib/db';
import { customersDb } from '@/lib/db/customers';
import {
  adjustCustomerPendingPoints,
  adjustCustomerPoints,
  releaseCustomerPendingPoints,
  updateOrderLoyaltyFields,
} from '@/lib/db/loyalty-points';
import { quoteOrderPointsEarn } from '@/lib/loyalty/points';

type OrderLoyaltySnapshot = Pick<
  OrderRecord,
  | 'id'
  | 'status'
  | 'customerId'
  | 'totalAmount'
  | 'pointsRedeemed'
  | 'pointsDiscountAmount'
  | 'pointsEarned'
  | 'pointsAwardedAt'
  | 'pointsFirstOrderBonus'
>;

function orderHasPointsAwarded(order: OrderLoyaltySnapshot): boolean {
  return Boolean(order.pointsAwardedAt);
}

function orderHasPendingPoints(order: OrderLoyaltySnapshot): boolean {
  return (
    (order.pointsEarned ?? 0) > 0 &&
    !order.pointsAwardedAt &&
    order.status !== 'cancelled'
  );
}

export async function redeemPointsForOrder(input: {
  customerId: string;
  orderId: string;
  pointsCharged: number;
  discountMkd: number;
}): Promise<void> {
  if (input.pointsCharged <= 0) return;

  await adjustCustomerPoints({
    customerId: input.customerId,
    delta: -input.pointsCharged,
    type: 'redeem',
    orderId: input.orderId,
    note: `Redeemed for ${input.discountMkd} MKD discount`,
    idempotencyKey: `redeem:${input.orderId}`,
  });

  await updateOrderLoyaltyFields(input.orderId, {
    customerId: input.customerId,
    pointsRedeemed: input.pointsCharged,
    pointsDiscountAmount: input.discountMkd,
  });
}

export async function reservePendingPointsForOrder(input: {
  customerId: string;
  orderId: string;
  cashPaidMkd: number;
}): Promise<{ total: number; bonus: number }> {
  const customer = await customersDb.findById(input.customerId);
  if (!customer) return { total: 0, bonus: 0 };

  const quote = quoteOrderPointsEarn({
    cashPaidMkd: input.cashPaidMkd,
    firstOrderBonusEligible: !customer.firstOrderBonusGranted,
  });

  if (quote.total <= 0) return { total: 0, bonus: 0 };

  await adjustCustomerPendingPoints({
    customerId: input.customerId,
    delta: quote.total,
    type: 'pending_earn',
    orderId: input.orderId,
    note: `Pending from order (${input.cashPaidMkd} MKD paid)`,
    idempotencyKey: `pending:${input.orderId}`,
  });

  await updateOrderLoyaltyFields(input.orderId, {
    customerId: input.customerId,
    pointsEarned: quote.total,
    pointsFirstOrderBonus: quote.bonus,
    pointsAwardedAt: null,
  });

  return { total: quote.total, bonus: quote.bonus };
}

export async function refundRedeemedPointsForOrder(
  order: OrderLoyaltySnapshot,
): Promise<void> {
  if (!order.customerId || (order.pointsRedeemed ?? 0) <= 0) return;

  const pointsRedeemed = order.pointsRedeemed ?? 0;
  await adjustCustomerPoints({
    customerId: order.customerId,
    delta: pointsRedeemed,
    type: 'refund',
    orderId: order.id,
    note: 'Order cancelled — points refunded',
    idempotencyKey: `refund-redeem:${order.id}`,
  });
}

export async function cancelPendingPointsForOrder(
  order: OrderLoyaltySnapshot,
): Promise<void> {
  if (!order.customerId || !orderHasPendingPoints(order)) return;

  const pendingTotal = order.pointsEarned ?? 0;
  await adjustCustomerPendingPoints({
    customerId: order.customerId,
    delta: -pendingTotal,
    type: 'pending_cancel',
    orderId: order.id,
    note: 'Order cancelled — pending points removed',
    idempotencyKey: `cancel-pending:${order.id}`,
  });

  await updateOrderLoyaltyFields(order.id, {
    pointsEarned: 0,
    pointsFirstOrderBonus: 0,
    pointsAwardedAt: null,
  });
}

export async function releasePendingPointsForDeliveredOrder(
  order: OrderLoyaltySnapshot,
): Promise<{ earned: number; bonus: number }> {
  if (!order.customerId) return { earned: 0, bonus: 0 };
  if (order.status !== 'delivered') return { earned: 0, bonus: 0 };
  if (orderHasPointsAwarded(order)) return { earned: 0, bonus: 0 };

  const pendingTotal = order.pointsEarned ?? 0;
  if (pendingTotal <= 0) return { earned: 0, bonus: 0 };

  const bonus = order.pointsFirstOrderBonus ?? 0;
  const earned = Math.max(0, pendingTotal - bonus);

  await releaseCustomerPendingPoints({
    customerId: order.customerId,
    amount: pendingTotal,
    orderId: order.id,
    note: `Released after delivery (${earned} earned${bonus > 0 ? ` + ${bonus} bonus` : ''})`,
    idempotencyKey: `release:${order.id}`,
  });

  if (bonus > 0) {
    await customersDb.markFirstOrderBonusGranted(order.customerId);
  }

  await updateOrderLoyaltyFields(order.id, {
    pointsAwardedAt: new Date().toISOString(),
  });

  return { earned, bonus };
}

export async function clawBackPointsForCancelledDeliveredOrder(
  order: OrderLoyaltySnapshot,
): Promise<void> {
  if (!order.customerId || !orderHasPointsAwarded(order)) return;
  if (order.pointsEarned == null || order.pointsEarned <= 0) return;

  await adjustCustomerPoints({
    customerId: order.customerId,
    delta: -order.pointsEarned,
    type: 'clawback',
    orderId: order.id,
    note: 'Delivered order cancelled — points clawed back',
    idempotencyKey: `clawback:${order.id}`,
  });

  await updateOrderLoyaltyFields(order.id, {
    pointsEarned: 0,
    pointsFirstOrderBonus: 0,
    pointsAwardedAt: null,
  });
}

export async function handleOrderLoyaltyStatusChange(
  previousStatus: OrderStatus,
  nextStatus: OrderStatus,
  order: OrderLoyaltySnapshot,
): Promise<void> {
  if (previousStatus === nextStatus) return;

  if (nextStatus === 'cancelled') {
    await refundRedeemedPointsForOrder(order);
    if (previousStatus === 'delivered') {
      await clawBackPointsForCancelledDeliveredOrder(order);
    } else {
      await cancelPendingPointsForOrder(order);
    }
    return;
  }

  if (nextStatus === 'delivered' && previousStatus !== 'delivered') {
    await releasePendingPointsForDeliveredOrder({ ...order, status: 'delivered' });
  }
}
