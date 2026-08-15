/**
 * Client-safe Turnstile flags (no secret key).
 * NEXT_PUBLIC_TURNSTILE_ACTIVE is set at build time in next.config.ts only when
 * both TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY are present.
 */
export function isLocalDevHostname(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.localhost')
  );
}

export function isTurnstileActiveOnClient(): boolean {
  if (process.env.NEXT_PUBLIC_TURNSTILE_ACTIVE !== '1') return false;
  if (!getTurnstileSiteKey()) return false;
  if (
    typeof window !== 'undefined' &&
    isLocalDevHostname(window.location.hostname)
  ) {
    return false;
  }
  return true;
}

export function getTurnstileSiteKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  return key || undefined;
}
