const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function isTurnstileEnabled(): boolean {
  if (process.env.NODE_ENV === 'development') return false;

  return Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
}

export function isTurnstileConfiguredOnClient(): boolean {
  return isTurnstileEnabled();
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;

  if (!token || token.length < 10) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error('[turnstile] verify failed', err);
    return false;
  }
}

export async function requireTurnstileOrReject(
  token: string | undefined,
  remoteIp?: string,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  if (!isTurnstileEnabled()) return { ok: true };

  const valid = await verifyTurnstileToken(token ?? '', remoteIp);
  if (!valid) {
    return {
      ok: false,
      status: 403,
      message: 'Human verification failed. Please refresh and try again.',
    };
  }
  return { ok: true };
}
