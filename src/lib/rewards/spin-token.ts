import { createHmac, timingSafeEqual } from 'crypto';
import type { SpinPrizeKey } from '@/lib/rewards/spin-config';
import { getRequiredSecret } from '@/lib/security/secrets';

const TOKEN_TTL_MS = 15 * 60 * 1000;

function tokenSecret(): string {
  return getRequiredSecret('SPIN_HASH_SALT', ['ADMIN_SESSION_SECRET']);
}

export type SpinClaimPayload = {
  prizeKey: SpinPrizeKey;
  discountAmount: number;
  minOrderAmount: number;
  ipHash: string;
  exp: number;
};

export function createSpinClaimToken(
  payload: Omit<SpinClaimPayload, 'exp'>,
): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  const data = JSON.stringify({ ...payload, exp });
  const sig = createHmac('sha256', tokenSecret()).update(data).digest('base64url');
  const body = Buffer.from(data).toString('base64url');
  return `${body}.${sig}`;
}

export function verifySpinClaimToken(
  token: string,
  ipHash: string,
): SpinClaimPayload | null {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let data: string;
  try {
    data = Buffer.from(body, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = createHmac('sha256', tokenSecret())
    .update(data)
    .digest('base64url');

  try {
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  let payload: SpinClaimPayload;
  try {
    payload = JSON.parse(data) as SpinClaimPayload;
  } catch {
    return null;
  }

  if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
  if (payload.ipHash !== ipHash) return null;
  if (!payload.prizeKey || typeof payload.discountAmount !== 'number') return null;

  return payload;
}
