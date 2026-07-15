import { cache } from 'react';
import {
  products,
  type Product,
  type ProductDesignCategory,
  type ProductType,
} from '@/lib/data/catalog';
import {
  buildProductDesignCatalogEntries,
  filterDesignCatalogEntries,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import { getMergedProductDesignTemplates } from '@/lib/products/merged-product-designs';

/** Shared TTL for pages that still use route-level revalidate. */
export const CATALOG_CACHE_SECONDS = 3600;

export const CATALOG_CACHE_TAGS = {
  products: 'catalog-products',
  readyDesigns: 'catalog-ready-designs',
} as const;

/** Per-request memoization for synchronous catalog reads. */
export const getProductsByType = cache((type: ProductType): Product[] =>
  products.filter((product) => product.type === type),
);

/**
 * Ready-design entries for a product type.
 * Built in-memory from getMergedProductDesignTemplates (React cache) — do not
 * put this list in unstable_cache; it exceeds Next's 2MB Data Cache limit.
 */
export const getCachedReadyDesignEntriesForType = cache(
  async (
    type: ProductType,
    category: ProductDesignCategory = 'image-designs',
  ): Promise<ProductDesignCatalogEntry[]> => {
    const templates = await getMergedProductDesignTemplates();
    const entries = buildProductDesignCatalogEntries(category, templates);
    return filterDesignCatalogEntries(entries, {
      type,
      color: 'all',
      side: 'all',
    });
  },
);

/** Full premade design catalog by category (per-request memoization only). */
export const getCachedProductDesignCatalogEntries = cache(
  async (
    category: ProductDesignCategory,
  ): Promise<ProductDesignCatalogEntry[]> => {
    const templates = await getMergedProductDesignTemplates();
    return buildProductDesignCatalogEntries(category, templates);
  },
);

export type ProductTypeCatalogData = {
  products: Product[];
  readyDesignEntries: ProductDesignCatalogEntry[];
};

export async function getProductTypeCatalogData(
  type: ProductType,
): Promise<ProductTypeCatalogData> {
  const readyDesignEntries = await getCachedReadyDesignEntriesForType(
    type,
    'image-designs',
  );

  return {
    products: getProductsByType(type),
    readyDesignEntries,
  };
}
