/** Whether a coupon's validity window has ended (matches checkout validation). */
export function isCouponExpired(
  endsAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!endsAt) return false;
  return new Date(endsAt).getTime() < now;
}

export function isAccountRewardUsable(reward: {
  redeemed: boolean;
  endsAt: string | null;
}): boolean {
  return !reward.redeemed && !isCouponExpired(reward.endsAt);
}

/** Hide expired rewards that were never used; keep redeemed ones for history. */
export function filterVisibleAccountRewards<
  T extends { redeemed: boolean; endsAt: string | null },
>(rewards: T[]): T[] {
  return rewards.filter((reward) => reward.redeemed || !isCouponExpired(reward.endsAt));
}
