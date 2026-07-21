import type { Locale } from '@/i18n/navigation';

const DEFAULT_SITE_URL = 'https://print8.mk';

export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }

  // In local dev, fall back to localhost instead of the production domain so
  // OG/asset URLs built during `next dev` resolve to this machine instead of
  // silently depending on network access to the live site.
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT?.trim() || '3000';
    return `http://localhost:${port}`;
  }

  return DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalized}`;
}

export function localePath(locale: Locale, path = '') {
  const normalized = path.startsWith('/') ? path : path ? `/${path}` : '';
  return `/${locale}${normalized}`;
}

export function openGraphLocale(locale: Locale) {
  return locale === 'mk' ? 'mk_MK' : 'en_US';
}
