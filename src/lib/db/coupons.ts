import { nanoid } from 'nanoid';
import { getSupabaseAdmin } from '@/lib/supabase/client';

export type CouponKind = 'public' | 'reward_issued';

export type CouponRecord = {
  id: string;
  code: string;
  kind: CouponKind;
  discountAmount: number;
  minOrderAmount: number;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptionsPerDay: number | null;
  maxRedemptionsTotal: number | null;
  active: boolean;
  issuedToEmail: string | null;
  issuedFromOrderId: string | null;
  note: string | null;
  createdAt: string;
};

export type CouponRewardTier = {
  id: string;
  minSpend: number;
  rewardAmount: number;
  rewardMinOrderAmount: number;
  rewardValidDays: number;
  active: boolean;
  sortOrder: number;
  createdAt: string;
};

export type CouponRedemption = {
  id: string;
  couponId: string;
  orderId: string;
  orderNumber: string;
  discountAmount: number;
  customerEmail: string | null;
  customerPhone: string | null;
  createdAt: string;
};

type CouponRow = {
  id: string;
  code: string;
  kind: string;
  discount_amount: number | string;
  min_order_amount: number | string;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions_per_day: number | null;
  max_redemptions_total: number | null;
  active: boolean;
  issued_to_email: string | null;
  issued_from_order_id: string | null;
  note: string | null;
  created_at: string;
};

type TierRow = {
  id: string;
  min_spend: number | string;
  reward_amount: number | string;
  reward_min_order_amount: number | string;
  reward_valid_days: number;
  active: boolean;
  sort_order: number;
  created_at: string;
};

type RedemptionRow = {
  id: string;
  coupon_id: string;
  order_id: string;
  order_number: string;
  discount_amount: number | string;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
};

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

function mapCoupon(row: CouponRow): CouponRecord {
  return {
    id: row.id,
    code: row.code,
    kind: row.kind === 'reward_issued' ? 'reward_issued' : 'public',
    discountAmount: Number(row.discount_amount),
    minOrderAmount: Number(row.min_order_amount),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    maxRedemptionsPerDay: row.max_redemptions_per_day,
    maxRedemptionsTotal: row.max_redemptions_total,
    active: Boolean(row.active),
    issuedToEmail: row.issued_to_email,
    issuedFromOrderId: row.issued_from_order_id,
    note: row.note,
    createdAt: row.created_at,
  };
}

function mapTier(row: TierRow): CouponRewardTier {
  return {
    id: row.id,
    minSpend: Number(row.min_spend),
    rewardAmount: Number(row.reward_amount),
    rewardMinOrderAmount: Number(row.reward_min_order_amount),
    rewardValidDays: row.reward_valid_days,
    active: Boolean(row.active),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapRedemption(row: RedemptionRow): CouponRedemption {
  return {
    id: row.id,
    couponId: row.coupon_id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    discountAmount: Number(row.discount_amount),
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    createdAt: row.created_at,
  };
}

function startOfUtcDayIso(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return d.toISOString();
}

export async function listCoupons(limit = 200): Promise<CouponRecord[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as CouponRow[] | null)?.map(mapCoupon) ?? [];
}

export async function getCouponByCode(code: string): Promise<CouponRecord | null> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;

  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .select('*')
    .ilike('code', normalized)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCoupon(data as CouponRow);
}

export async function getCouponById(id: string): Promise<CouponRecord | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCoupon(data as CouponRow);
}

export async function createCoupon(input: {
  code: string;
  kind?: CouponKind;
  discountAmount: number;
  minOrderAmount?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  maxRedemptionsPerDay?: number | null;
  maxRedemptionsTotal?: number | null;
  active?: boolean;
  issuedToEmail?: string | null;
  issuedFromOrderId?: string | null;
  note?: string | null;
}): Promise<CouponRecord> {
  const code = normalizeCouponCode(input.code);
  const id = nanoid();
  const payload = {
    id,
    code,
    kind: input.kind ?? 'public',
    discount_amount: input.discountAmount,
    min_order_amount: input.minOrderAmount ?? 0,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
    max_redemptions_per_day: input.maxRedemptionsPerDay ?? null,
    max_redemptions_total: input.maxRedemptionsTotal ?? null,
    active: input.active ?? true,
    issued_to_email: input.issuedToEmail ?? null,
    issued_from_order_id: input.issuedFromOrderId ?? null,
    note: input.note ?? null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapCoupon(data as CouponRow);
}

export async function updateCoupon(
  id: string,
  patch: Partial<{
    discountAmount: number;
    minOrderAmount: number;
    startsAt: string | null;
    endsAt: string | null;
    maxRedemptionsPerDay: number | null;
    maxRedemptionsTotal: number | null;
    active: boolean;
    note: string | null;
  }>,
): Promise<CouponRecord> {
  const row: Record<string, unknown> = {};
  if (patch.discountAmount !== undefined) row.discount_amount = patch.discountAmount;
  if (patch.minOrderAmount !== undefined) row.min_order_amount = patch.minOrderAmount;
  if (patch.startsAt !== undefined) row.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) row.ends_at = patch.endsAt;
  if (patch.maxRedemptionsPerDay !== undefined) {
    row.max_redemptions_per_day = patch.maxRedemptionsPerDay;
  }
  if (patch.maxRedemptionsTotal !== undefined) {
    row.max_redemptions_total = patch.maxRedemptionsTotal;
  }
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.note !== undefined) row.note = patch.note;

  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .update(row)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapCoupon(data as CouponRow);
}

export async function deleteCoupon(id: string): Promise<void> {
  const { count, error: countError } = await getSupabaseAdmin()
    .from('coupon_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', id);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) > 0) {
    throw new Error('Coupon has redemptions; deactivate it instead of deleting');
  }

  const { error } = await getSupabaseAdmin().from('coupons').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function countCouponRedemptions(couponId: string): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('coupon_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', couponId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function countCouponRedemptionsToday(couponId: string): Promise<number> {
  const { count, error } = await getSupabaseAdmin()
    .from('coupon_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_id', couponId)
    .gte('created_at', startOfUtcDayIso());
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type IssuedRewardCoupon = CouponRecord & {
  redeemed: boolean;
};

export async function listIssuedRewardCouponsForEmail(
  email: string,
): Promise<IssuedRewardCoupon[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];

  const { data, error } = await getSupabaseAdmin()
    .from('coupons')
    .select('*')
    .eq('issued_to_email', normalized)
    .eq('kind', 'reward_issued')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const coupons = ((data ?? []) as CouponRow[]).map(mapCoupon);
  const results: IssuedRewardCoupon[] = [];

  for (const coupon of coupons) {
    const totalUsed = await countCouponRedemptions(coupon.id);
    const redeemed =
      coupon.maxRedemptionsTotal != null &&
      totalUsed >= coupon.maxRedemptionsTotal;
    results.push({ ...coupon, redeemed });
  }

  return results;
}

export async function recordCouponRedemption(input: {
  couponId: string;
  orderId: string;
  orderNumber: string;
  discountAmount: number;
  customerEmail?: string | null;
  customerPhone?: string | null;
}): Promise<CouponRedemption> {
  const payload = {
    id: nanoid(),
    coupon_id: input.couponId,
    order_id: input.orderId,
    order_number: input.orderNumber,
    discount_amount: input.discountAmount,
    customer_email: input.customerEmail ?? null,
    customer_phone: input.customerPhone ?? null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await getSupabaseAdmin()
    .from('coupon_redemptions')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapRedemption(data as RedemptionRow);
}

export async function listRewardTiers(): Promise<CouponRewardTier[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('coupon_reward_tiers')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('min_spend', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as TierRow[] | null)?.map(mapTier) ?? [];
}

export async function upsertRewardTier(input: {
  id?: string;
  minSpend: number;
  rewardAmount: number;
  rewardMinOrderAmount?: number;
  rewardValidDays?: number;
  active?: boolean;
  sortOrder?: number;
}): Promise<CouponRewardTier> {
  const id = input.id ?? nanoid();
  const payload = {
    id,
    min_spend: input.minSpend,
    reward_amount: input.rewardAmount,
    reward_min_order_amount: input.rewardMinOrderAmount ?? 0,
    reward_valid_days: input.rewardValidDays ?? 30,
    active: input.active ?? true,
    sort_order: input.sortOrder ?? 0,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await getSupabaseAdmin()
    .from('coupon_reward_tiers')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return mapTier(data as TierRow);
}

export async function deleteRewardTier(id: string): Promise<void> {
  const { error } = await getSupabaseAdmin()
    .from('coupon_reward_tiers')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function issueRewardCoupon(input: {
  discountAmount: number;
  minOrderAmount: number;
  validDays: number;
  email: string | null;
  fromOrderId: string;
}): Promise<CouponRecord> {
  const code = `P8R-${nanoid(8).toUpperCase()}`;
  const endsAt = new Date();
  endsAt.setUTCDate(endsAt.getUTCDate() + input.validDays);

  return createCoupon({
    code,
    kind: 'reward_issued',
    discountAmount: input.discountAmount,
    minOrderAmount: input.minOrderAmount,
    startsAt: new Date().toISOString(),
    endsAt: endsAt.toISOString(),
    maxRedemptionsPerDay: 1,
    maxRedemptionsTotal: 1,
    active: true,
    issuedToEmail: input.email,
    issuedFromOrderId: input.fromOrderId,
    note: 'Auto-issued reward coupon',
  });
}

/** One-time spin-wheel coupon locked to the winner's email. */
export async function issueSpinCoupon(input: {
  discountAmount: number;
  minOrderAmount: number;
  validDays: number;
  email: string;
}): Promise<CouponRecord> {
  const code = `P8W-${nanoid(8).toUpperCase()}`;
  const endsAt = new Date();
  endsAt.setUTCDate(endsAt.getUTCDate() + input.validDays);

  return createCoupon({
    code,
    kind: 'reward_issued',
    discountAmount: input.discountAmount,
    minOrderAmount: input.minOrderAmount,
    startsAt: new Date().toISOString(),
    endsAt: endsAt.toISOString(),
    maxRedemptionsPerDay: 1,
    maxRedemptionsTotal: 1,
    active: true,
    issuedToEmail: input.email.trim().toLowerCase(),
    issuedFromOrderId: null,
    note: 'Spin wheel reward',
  });
}

export function pickBestRewardTier(
  tiers: CouponRewardTier[],
  spendAmount: number,
): CouponRewardTier | null {
  const eligible = tiers
    .filter((tier) => tier.active && spendAmount + 1e-9 >= tier.minSpend)
    .sort((a, b) => b.minSpend - a.minSpend);
  return eligible[0] ?? null;
}
