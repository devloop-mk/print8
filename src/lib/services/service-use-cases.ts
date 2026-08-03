import type { ServiceId } from '@/lib/data/catalog';

/** Optional use-case keys rendered on service detail pages (i18n under items.{id}.useCases.*). */
export const SERVICE_USE_CASE_KEYS: Partial<Record<ServiceId, readonly string[]>> = {
  'a3-posters': [
    'events',
    'school',
    'retail',
    'office',
    'promo',
    'hospitality',
  ],
};
