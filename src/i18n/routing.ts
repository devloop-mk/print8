import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['mk', 'en'],
  defaultLocale: 'mk',
  localePrefix: 'as-needed',
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
