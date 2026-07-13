import 'server-only';

import { revalidateTag } from 'next/cache';
import { CATALOG_DESIGNS_CACHE_TAG } from '@/lib/catalog/design-catalog';

export function revalidateDesignCatalogCache() {
  revalidateTag(CATALOG_DESIGNS_CACHE_TAG, 'max');
}
