import { routing, type Locale } from '@/i18n/routing';
import type { NextRequest } from 'next/server';

const LOCALE_PREFIX = new RegExp(`^/(${routing.locales.join('|')})(/|$)`);

/** Prevent open redirects — only locale-prefixed in-app paths. */
export function sanitizeOAuthNextPath(
  next: string | null,
  fallbackLocale: Locale = routing.defaultLocale,
): string {
  const fallback = `/${fallbackLocale}/account`;
  if (!next || !next.startsWith('/')) return fallback;

  const pathOnly = next.split('?')[0]?.split('#')[0] ?? '';
  if (!LOCALE_PREFIX.test(pathOnly)) return fallback;

  if (pathOnly.includes('//') || pathOnly.includes('\\')) return fallback;

  return next;
}

export const OAUTH_NEXT_COOKIE = 'print8_oauth_next';

export function buildOAuthCallbackUrl(origin: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/auth/callback`;
}

export function buildLocalizedAccountPath(locale: Locale, path = '/account'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

/** Origin behind Vercel / reverse proxies (matches the browser URL). */
export function getRequestOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedHost) {
    const host = forwardedHost.split(',')[0]?.trim();
    const proto = (forwardedProto?.split(',')[0]?.trim() ?? 'https').replace(/:$/, '');
    return `${proto}://${host}`;
  }
  return request.nextUrl.origin;
}

export function resolveLocaleFromOAuthPath(path: string): Locale {
  const match = path.match(/^\/(mk|en)(\/|$)/);
  if (match && routing.locales.includes(match[1] as Locale)) {
    return match[1] as Locale;
  }
  return routing.defaultLocale;
}
