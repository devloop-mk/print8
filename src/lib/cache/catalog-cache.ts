import { cache } from 'react';
import {
  products,
  type Product,
  type ProductDesignCategory,
  type ProductType,
} from '@/lib/data/catalog';
import { getProductDisplayOrderRecord } from '@/lib/cms/display-order';
import {
  filterProductsByStorefrontVisibility,
  getProductVisibilityRecord,
} from '@/lib/cms/product-visibility';
import {
  buildProductDesignCatalogEntries,
  filterDesignCatalogEntries,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import { getMergedProductDesignTemplates } from '@/lib/products/merged-product-designs';
import {
  resolveCategoryMockupPreviews,
  type CategoryMockupPreview,
} from '@/lib/products/product-type-design-categories';
import { sortByDisplayOrder } from '@/lib/products/sort-by-display-order';
import { productMatchesCatalogType } from '@/lib/products/drinkware-type-groups';
import {
  GARMENT_FIT_ORDER,
  getProductGarmentFit,
} from '@/lib/products/garment-fit';

/** Shared TTL for pages that still use route-level revalidate. */
export const CATALOG_CACHE_SECONDS = 21600;

export const CATALOG_CACHE_TAGS = {
  products: 'catalog-products',
  readyDesigns: 'catalog-ready-designs',
} as const;

/** Per-request memoization for synchronous catalog reads (catalog array order). */
export const getProductsByType = cache((type: ProductType): Product[] =>
  products.filter((product) => productMatchesCatalogType(product, type)),
);

/** Unisex → women → kids on type pages, then admin display order within a fit. */
function sortTshirtProductsByFit(items: Product[]): Product[] {
  return [...items].sort((a, b) => {
    const fitA = GARMENT_FIT_ORDER.indexOf(getProductGarmentFit(a) ?? 'unisex');
    const fitB = GARMENT_FIT_ORDER.indexOf(getProductGarmentFit(b) ?? 'unisex');
    if (fitA !== fitB) return fitA - fitB;
    return 0;
  });
}

export const getOrderedProductsByType = cache(
  async (type: ProductType): Promise<Product[]> => {
    const [orderMap, visibility] = await Promise.all([
      getProductDisplayOrderRecord(),
      getProductVisibilityRecord(),
    ]);
    const visible = filterProductsByStorefrontVisibility(
      getProductsByType(type),
      visibility,
    );
    const ordered = sortByDisplayOrder(visible, orderMap);
    return type === 't-shirt' ? sortTshirtProductsByFit(ordered) : ordered;
  },
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
  categoryPreviews: Record<string, CategoryMockupPreview>;
};

export async function getProductTypeCatalogData(
  type: ProductType,
): Promise<ProductTypeCatalogData> {
  const [readyDesignEntries, products, categoryPreviews] = await Promise.all([
    getCachedReadyDesignEntriesForType(type, 'image-designs'),
    getOrderedProductsByType(type),
    resolveCategoryMockupPreviews(type),
  ]);

  return {
    products,
    readyDesignEntries,
    categoryPreviews,
  };
}
