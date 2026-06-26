import type { Locale } from '@/i18n/navigation';

export const localeConfig: Record<Locale, { shortLabel: string }> = {
  mk: { shortLabel: 'MK' },
  en: { shortLabel: 'EN' },
};

export function isLocale(value: string): value is Locale {
  return value in localeConfig;
}
