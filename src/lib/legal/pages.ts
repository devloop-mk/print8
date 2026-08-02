export const LEGAL_PAGE_KEYS = [
  'privacy',
  'terms',
  'cookies',
  'returns',
  'legal-notice',
] as const;

export type LegalPageKey = (typeof LEGAL_PAGE_KEYS)[number];

export const LEGAL_PAGE_PATHS: Record<LegalPageKey, string> = {
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  returns: '/returns',
  'legal-notice': '/legal-notice',
};

export function isLegalPageKey(value: string): value is LegalPageKey {
  return LEGAL_PAGE_KEYS.includes(value as LegalPageKey);
}

/** Paths linked from the cookie banner — show a bottom bar instead of a blocking modal. */
export const COOKIE_CONSENT_RELATED_PATHS = ['/cookies', '/privacy'] as const;

export function isCookieConsentRelatedPath(pathname: string): boolean {
  return COOKIE_CONSENT_RELATED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
