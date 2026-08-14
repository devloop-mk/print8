import { createHmac, timingSafeEqual } from 'crypto';
import { getRequiredSecret } from '@/lib/security/secrets';

function emailPreviewSecret(): string {
  return getRequiredSecret('EMAIL_PREVIEW_SECRET', ['ADMIN_SESSION_SECRET']);
}

export function signEmailPreviewUrl(orderNumber: string, filename: string): string {
  return createHmac('sha256', emailPreviewSecret())
    .update(`${orderNumber}:${filename}`)
    .digest('base64url')
    .slice(0, 32);
}

export function verifyEmailPreviewSignature(
  orderNumber: string,
  filename: string,
  signature: string,
): boolean {
  if (!signature) return false;
  const expected = signEmailPreviewUrl(orderNumber, filename);
  try {
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}
