import 'server-only';

import { revalidatePath, revalidateTag } from 'next/cache';
import {
  CATALOG_DESIGNS_CACHE_TAG,
  HOME_FEATURED_DESIGNS_CACHE_TAG,
} from '@/lib/catalog/design-catalog';
import { routing } from '@/i18n/routing';

/** Bust published-design Data Cache (force-dynamic listings + designs hub). */
export function revalidateDesignCatalogCache() {
  revalidateTag(CATALOG_DESIGNS_CACHE_TAG, 'max');
}

/**
 * Admin design mutations only — refresh light ISR shells (home / designs hub)
 * without relying on `catalog-designs` (which exclusive orders also use).
 */
export function revalidateStorefrontDesignListingPaths() {
  revalidateTag(HOME_FEATURED_DESIGNS_CACHE_TAG, 'max');
  for (const locale of routing.locales) {
    revalidatePath(`/${locale}`, 'page');
    revalidatePath(`/${locale}/designs`, 'page');
  }
}
