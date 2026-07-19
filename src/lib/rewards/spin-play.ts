import { createHash, randomInt } from 'crypto';
import { nanoid } from 'nanoid';
import { getSupabaseAdmin } from '@/lib/supabase/client';
import {
  SPIN_SEGMENTS,
  type SpinPrizeKey,
  type SpinSegment,
} from '@/lib/rewards/spin-config';

export type SpinPlayRecord = {
  id: string;
  email: string;
  emailNormalized: string;
  prizeKey: SpinPrizeKey;
  discountAmount: number;
  couponId: string | null;
  couponCode: string | null;
  ipHash: string | null;
  userAgentHash: string | null;
  locale: string | null;
  createdAt: string;
};

type SpinPlayRow = {
  id: string;
  email: string;
  email_normalized: string;
  prize_key: string;
  discount_amount: number | string;
  coupon_id: string | null;
  coupon_code: string | null;
  ip_hash: string | null;
  user_agent_hash: string | null;
  locale: string | null;
  created_at: string;
};

function mapRow(row: SpinPlayRow): SpinPlayRecord {
  return {
    id: row.id,
    email: row.email,
    emailNormalized: row.email_normalized,
    prizeKey: row.prize_key as SpinPrizeKey,
    discountAmount: Number(row.discount_amount),
    couponId: row.coupon_id,
    couponCode: row.coupon_code,
    ipHash: row.ip_hash,
    userAgentHash: row.user_agent_hash,
    locale: row.locale,
    createdAt: row.created_at,
  };
}

export function normalizeSpinEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashSalt(): string {
  // Prefer a dedicated salt; never couple fingerprint hashing to Resend keys.
  return (
    process.env.SPIN_HASH_SALT ||
    process.env.ADMIN_SESSION_SECRET ||
    'print8-spin-fallback-salt'
  );
}

export function hashSpinFingerprint(value: string): string {
  return createHash('sha256')
    .update(`${hashSalt()}:${value}`)
    .digest('hex')
    .slice(0, 32);
}

/** Weighted pick among winning segments only (weight > 0 and discount > 0). */
export function pickWeightedSpinPrize(): SpinSegment {
  const pool = SPIN_SEGMENTS.filter(
    (segment) =>
      segment.weight > 0 &&
      segment.discountAmount > 0 &&
      segment.key !== 'try_again',
  );
  const fallback =
    pool[0] ??
    SPIN_SEGMENTS.find(
      (segment) => segment.discountAmount > 0 && segment.key !== 'try_again',
    ) ??
    SPIN_SEGMENTS[0];
  const totalWeight = pool.reduce((sum, segment) => sum + segment.weight, 0);
  if (totalWeight <= 0) return fallback;

  let ticket = randomInt(totalWeight);
  for (const segment of pool) {
    ticket -= segment.weight;
    if (ticket < 0) return segment;
  }
  return fallback;
}

export async function findSpinPlayByEmail(
  email: string,
): Promise<SpinPlayRecord | null> {
  const supabase = getSupabaseAdmin();
  const emailNormalized = normalizeSpinEmail(email);
  const { data, error } = await supabase
    .from('spin_plays')
    .select('*')
    .eq('email_normalized', emailNormalized)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data as SpinPlayRow);
}

export async function insertSpinPlay(input: {
  email: string;
  prizeKey: SpinPrizeKey;
  discountAmount: number;
  couponId?: string | null;
  couponCode?: string | null;
  ipHash?: string | null;
  userAgentHash?: string | null;
  locale?: string | null;
}): Promise<{ play: SpinPlayRecord | null; duplicate: boolean }> {
  const supabase = getSupabaseAdmin();
  const id = nanoid();
  const emailNormalized = normalizeSpinEmail(input.email);
  const row = {
    id,
    email: input.email.trim(),
    email_normalized: emailNormalized,
    prize_key: input.prizeKey,
    discount_amount: input.discountAmount,
    coupon_id: input.couponId ?? null,
    coupon_code: input.couponCode ?? null,
    ip_hash: input.ipHash ?? null,
    user_agent_hash: input.userAgentHash ?? null,
    locale: input.locale ?? null,
  };

  const { data, error } = await supabase
    .from('spin_plays')
    .insert(row)
    .select('*')
    .maybeSingle();

  if (error) {
    // Unique violation — race or already played
    if (error.code === '23505') {
      return { play: null, duplicate: true };
    }
    throw error;
  }

  if (!data) return { play: null, duplicate: false };
  return { play: mapRow(data as SpinPlayRow), duplicate: false };
}

export async function updateSpinPlayCoupon(input: {
  id: string;
  couponId: string;
  couponCode: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('spin_plays')
    .update({
      coupon_id: input.couponId,
      coupon_code: input.couponCode,
    })
    .eq('id', input.id);

  if (error) throw error;
}

export async function listRecentSpinPlays(limit = 50): Promise<SpinPlayRecord[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('spin_plays')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as SpinPlayRow[]).map(mapRow);
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 1) return '***';
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}
