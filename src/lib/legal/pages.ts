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
