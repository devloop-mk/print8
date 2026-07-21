import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import {
  productDesignTemplates as staticProductDesignTemplates,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import {
  managedProductDesignsDb,
  type ManagedProductDesignRecord,
} from '@/lib/db/managed-product-designs';
import { getDesignDisplayOrderRecord } from '@/lib/cms/display-order';
import { mergeProductDesignCatalog } from '@/lib/products/merge-product-designs';

export const PRODUCT_DESIGNS_CACHE_TAG = 'product-designs';

/**
 * Cache only managed DB overrides — not the full static streetwear catalog.
 * Putting ~850 templates into Next's Data Cache exceeds the 2MB limit.
 */
const getCachedManagedProductDesignRecords = unstable_cache(
  async (): Promise<ManagedProductDesignRecord[]> =>
    managedProductDesignsDb.list(),
  ['managed-product-design-records'],
  {
    revalidate: 1800,
    tags: [PRODUCT_DESIGNS_CACHE_TAG],
  },
);

/**
 * Merge static catalog (already in the module heap) with cached managed rows.
 * Memoized per request via React cache — never written to Data Cache.
 */
export const getMergedProductDesignTemplates = cache(
  async (): Promise<ProductDesignTemplate[]> => {
    const [managed, displayOrder] = await Promise.all([
      getCachedManagedProductDesignRecords(),
      getDesignDisplayOrderRecord(),
    ]);
    return mergeProductDesignCatalog(
      staticProductDesignTemplates,
      managed,
      displayOrder,
    );
  },
);

export async function getMergedProductDesignTemplate(
  id: string,
): Promise<ProductDesignTemplate | null> {
  const templates = await getMergedProductDesignTemplates();
  return templates.find((template) => template.id === id) ?? null;
}

/** Synchronous fallback for client-only code paths (static catalog only). */
export function getStaticProductDesignTemplates(): ProductDesignTemplate[] {
  return staticProductDesignTemplates;
}
