import { routing, type Locale } from '@/i18n/routing';

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

export function buildOAuthCallbackUrl(origin: string, nextPath: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

export function buildLocalizedAccountPath(locale: Locale, path = '/account'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized}`;
}
