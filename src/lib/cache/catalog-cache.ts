import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import {
  products,
  type Product,
  type ProductDesignCategory,
  type ProductType,
} from '@/lib/data/catalog';
import {
  buildProductDesignCatalogEntries,
  getMergedProductDesignCatalogEntries,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';

/** Shared TTL for static catalog derivations (products, premade designs). */
export const CATALOG_CACHE_SECONDS = 3600;

export const CATALOG_CACHE_TAGS = {
  products: 'catalog-products',
  readyDesigns: 'catalog-ready-designs',
} as const;

/** Per-request memoization for synchronous catalog reads. */
export const getProductsByType = cache((type: ProductType): Product[] =>
  products.filter((product) => product.type === type),
);

/** Cross-request cache for premade design lists keyed by product type. */
export const getCachedReadyDesignEntriesForType = unstable_cache(
  async (type: ProductType, category: ProductDesignCategory = 'image-designs') => {
    const { getMergedProductDesignTemplates } = await import(
      '@/lib/products/merged-product-designs'
    );
    const { filterDesignCatalogEntries } = await import(
      '@/lib/products/design-catalog'
    );
    const templates = await getMergedProductDesignTemplates();
    const entries = buildProductDesignCatalogEntries(category, templates);
    return filterDesignCatalogEntries(entries, {
      type,
      color: 'all',
      side: 'all',
    });
  },
  ['catalog-ready-designs-by-type'],
  {
    revalidate: CATALOG_CACHE_SECONDS,
    tags: [CATALOG_CACHE_TAGS.readyDesigns, 'product-designs'],
  },
);

/** Cross-request cache for full premade design catalog by category. */
export const getCachedProductDesignCatalogEntries = unstable_cache(
  async (category: ProductDesignCategory) =>
    getMergedProductDesignCatalogEntries(category),
  ['catalog-product-design-entries'],
  {
    revalidate: CATALOG_CACHE_SECONDS,
    tags: [CATALOG_CACHE_TAGS.readyDesigns, 'product-designs'],
  },
);

export type ProductTypeCatalogData = {
  products: Product[];
  readyDesignEntries: ProductDesignCatalogEntry[];
};

export async function getProductTypeCatalogData(
  type: ProductType,
): Promise<ProductTypeCatalogData> {
  const [readyDesignEntries] = await Promise.all([
    getCachedReadyDesignEntriesForType(type, 'image-designs'),
  ]);

  return {
    products: getProductsByType(type),
    readyDesignEntries,
  };
}
