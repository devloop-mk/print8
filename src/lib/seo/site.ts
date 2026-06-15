import type { Locale } from '@/i18n/routing';

const DEFAULT_SITE_URL = 'https://print8.mk';

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  return url.replace(/\/$/, '');
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
