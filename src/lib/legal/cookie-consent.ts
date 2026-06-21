export const COOKIE_CONSENT_KEY = 'print8_cookie_consent';

export type CookieConsentValue = 'accepted' | 'rejected';

export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === 'accepted' || value === 'rejected') return value;
  return null;
}

export function setCookieConsent(value: CookieConsentValue) {
  localStorage.setItem(COOKIE_CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent('print8:cookie-consent', { detail: value }));
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === 'accepted';
}
