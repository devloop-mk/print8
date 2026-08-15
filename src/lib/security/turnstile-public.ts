/**
 * Client-safe Turnstile flags (no secret key).
 * NEXT_PUBLIC_TURNSTILE_ACTIVE is set at build time in next.config.ts only when
 * both TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY are present.
 */
export function isTurnstileActiveOnClient(): boolean {
  return process.env.NEXT_PUBLIC_TURNSTILE_ACTIVE === '1';
}

export function getTurnstileSiteKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return key || undefined;
}
