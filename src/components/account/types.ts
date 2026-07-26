import { filterVisibleAccountRewards } from '@/lib/coupons/coupon-lifecycle';

export type AccountOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  pointsRedeemed: number;
  pointsEarned: number | null;
  pointsAwardedAt: string | null;
  createdAt: string;
};

export type PointTransaction = {
  id: string;
  type: string;
  points: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

export type AccountReward = {
  code: string;
  discountAmount: number;
  minOrderAmount: number | null;
  redeemed: boolean;
  endsAt: string | null;
  createdAt: string;
};

export function mergeAccountRewards(
  spinReward: {
    couponCode: string | null;
    discountAmount: number;
    minOrderAmount: number | null;
    redeemed: boolean;
    endsAt: string | null;
    createdAt: string;
  } | null,
  coupons: AccountReward[],
): AccountReward[] {
  if (!spinReward?.couponCode) return filterVisibleAccountRewards(coupons);

  const fromSpin: AccountReward = {
    code: spinReward.couponCode,
    discountAmount: spinReward.discountAmount,
    minOrderAmount: spinReward.minOrderAmount,
    redeemed: spinReward.redeemed,
    endsAt: spinReward.endsAt,
    createdAt: spinReward.createdAt,
  };

  return filterVisibleAccountRewards([
    fromSpin,
    ...coupons.filter((c) => c.code !== spinReward.couponCode),
  ]);
}
