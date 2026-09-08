import 'server-only';

import { revalidateTag } from 'next/cache';
import {
  CATALOG_DESIGNS_CACHE_TAG,
  HOME_FEATURED_DESIGNS_CACHE_TAG,
} from '@/lib/catalog/design-catalog';

/** Bust published-design Data Cache (force-dynamic listings + designs hub). */
export function revalidateDesignCatalogCache() {
  revalidateTag(CATALOG_DESIGNS_CACHE_TAG, 'max');
}

/**
 * Admin print-design mutations — bust homepage featured strip + /designs hub
 * category counts (both use `HOME_FEATURED_DESIGNS_CACHE_TAG`).
 *
 * Tag-only: avoids ~16 `revalidatePath` calls per save. Gallery routes
 * (`/designs/all`, `/designs/[id]`) are force-dynamic; products ISR pages
 * do not use this tag.
 */
export function revalidateStorefrontDesignListingPaths() {
  revalidateTag(HOME_FEATURED_DESIGNS_CACHE_TAG, 'max');
}
