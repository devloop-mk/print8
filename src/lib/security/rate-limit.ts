import type { NextRequest } from 'next/server';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function getClientIp(request: NextRequest | Request): string {
  // Prefer platform-set headers that clients cannot forge.
  const cfConnecting = request.headers.get('cf-connecting-ip')?.trim();
  if (cfConnecting) return cfConnecting;

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // On Vercel/Cloudflare the leftmost entry is the client IP added by the edge.
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'unknown';
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const bucketKey = `${key}:${Math.floor(now / windowMs)}`;
  const entry = buckets.get(bucketKey);

  if (!entry || now > entry.resetAt) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { allowed: true };
}

export function rateLimitResponse(retryAfterSec?: number) {
  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      ...(retryAfterSec
        ? { 'Retry-After': String(retryAfterSec) }
        : {}),
    },
  });
}

export function enforceRateLimit(
  request: NextRequest,
  routeKey: string,
  limit: number,
  windowMs: number,
) {
  const ip = getClientIp(request);
  const result = checkRateLimit(`${routeKey}:${ip}`, limit, windowMs);
  if (!result.allowed) {
    return rateLimitResponse(result.retryAfterSec);
  }
  return null;
}
