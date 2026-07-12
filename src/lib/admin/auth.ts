import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'print8_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type SessionPayload = {
  sub: string;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured');
  }
  return secret;
}

export function isAdminAuthConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME?.trim() &&
      process.env.ADMIN_PASSWORD?.trim() &&
      process.env.ADMIN_SESSION_SECRET?.trim(),
  );
}

function safeCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function validateAdminCredentials(username: string, password: string) {
  if (!isAdminAuthConfigured()) return false;

  const expectedUser = process.env.ADMIN_USERNAME!.trim();
  const expectedPass = process.env.ADMIN_PASSWORD!.trim();

  return safeCompare(username.trim(), expectedUser) && safeCompare(password, expectedPass);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToString(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  const base64 = padded + '='.repeat(padLength);
  return atob(base64);
}

async function signPayload(payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createAdminSessionToken(username: string) {
  const payload: SessionPayload = {
    sub: username,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encoded = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signPayload(encoded);
  return `${encoded}.${signature}`;
}

export async function verifyAdminSessionToken(token?: string | null) {
  if (!token || !isAdminAuthConfigured()) return null;

  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = await signPayload(encoded);
  if (!safeCompare(signature, expected)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlToString(encoded)) as SessionPayload;

    if (!payload.sub || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    if (!safeCompare(payload.sub, process.env.ADMIN_USERNAME!.trim())) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}
