import { routing } from '@/i18n/routing';

/** Strip locale prefix so next-intl router receives an internal pathname. */
export function toInternalPathname(pathname: string): string {
  const path = pathname.split('?')[0]?.split('#')[0] ?? '/';

  for (const locale of routing.locales) {
    if (path === `/${locale}`) return '/';
    if (path.startsWith(`/${locale}/`)) {
      const internal = path.slice(locale.length + 1);
      return internal || '/';
    }
  }

  return path || '/';
}

export function toInternalHref(href: string): string {
  const url = new URL(href, 'http://localhost');
  const internalPath = toInternalPathname(url.pathname);
  return `${internalPath}${url.search}${url.hash}`;
}
