import { routing, type Locale } from '@/i18n/routing';
import { localePath } from '@/lib/seo/site';
import type { NextRequest } from 'next/server';

const NON_DEFAULT_LOCALE_PREFIX = new RegExp(
  `^/(${routing.locales.filter((l) => l !== routing.defaultLocale).join('|')})(/|$)`,
);

/** Prevent open redirects — only in-app paths for allowed locales. */
export function sanitizeOAuthNextPath(
  next: string | null,
  fallbackLocale: Locale = routing.defaultLocale,
): string {
  const fallback = localePath(fallbackLocale, '/account');
  if (!next || !next.startsWith('/')) return fallback;

  const suffix = next.slice(next.split('?')[0]?.split('#')[0]?.length ?? 0);
  const pathOnly = next.split('?')[0]?.split('#')[0] ?? '';

  if (pathOnly.includes('//') || pathOnly.includes('\\')) return fallback;

  // Legacy /mk URLs → unprefixed default-locale paths.
  if (pathOnly === '/mk' || pathOnly.startsWith('/mk/')) {
    const stripped = pathOnly === '/mk' ? '/' : pathOnly.slice(3);
    return `${stripped}${suffix}`;
  }

  if (pathOnly === '/en' || pathOnly.startsWith('/en/')) {
    return next;
  }

  if (
    pathOnly === `/${routing.defaultLocale}` ||
    pathOnly.startsWith(`/${routing.defaultLocale}/`)
  ) {
    return fallback;
  }

  if (NON_DEFAULT_LOCALE_PREFIX.test(pathOnly)) {
    return fallback;
  }

  return next;
}

export const OAUTH_NEXT_COOKIE = 'print8_oauth_next';

export function buildOAuthCallbackUrl(origin: string): string {
  const base = origin.replace(/\/$/, '');
  return `${base}/auth/callback`;
}

export function buildLocalizedAccountPath(locale: Locale, path = '/account'): string {
  return localePath(locale, path);
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
  const pathOnly = path.split('?')[0]?.split('#')[0] ?? '';
  if (pathOnly === '/en' || pathOnly.startsWith('/en/')) {
    return 'en';
  }
  if (pathOnly === '/mk' || pathOnly.startsWith('/mk/')) {
    return routing.defaultLocale;
  }
  return routing.defaultLocale;
}
