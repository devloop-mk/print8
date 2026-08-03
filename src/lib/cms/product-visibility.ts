import { unstable_cache } from 'next/cache';
import {
  isBrowsableProduct,
  products,
  productTypes,
  type Product,
  type ProductType,
} from '@/lib/data/catalog';
import { productVisibilityDb } from '@/lib/db/product-visibility';
import { isProductTypeHiddenFromStorefront } from '@/lib/products/storefront-hidden-types';
import {
  productIdVariants,
  resolveProductId,
} from '@/lib/products/product-id-aliases';

export {
  STOREFONT_HIDDEN_PRODUCT_TYPES,
  filterProductsByInactiveIds,
  filterStorefrontHiddenProductTypes,
  isProductTypeHiddenFromStorefront,
} from '@/lib/products/storefront-hidden-types';

export const PRODUCT_VISIBILITY_CACHE_TAG = 'cms-product-visibility';

function isStorefrontProductVisible(
  product: Product,
  visibility: Record<string, boolean>,
): boolean {
  if (isProductTypeHiddenFromStorefront(product.type)) return false;
  return isProductActiveOnStorefront(product.id, visibility);
}

const getProductVisibilityRowsCached = unstable_cache(
  async () => productVisibilityDb.list(),
  ['cms-product-visibility-rows'],
  {
    revalidate: 1800,
    tags: [PRODUCT_VISIBILITY_CACHE_TAG],
  },
);

/** Explicit DB overrides only — absent product IDs default to visible. */
export async function getProductVisibilityRecord(): Promise<
  Record<string, boolean>
> {
  const rows = await getProductVisibilityRowsCached();
  return Object.fromEntries(rows.map((row) => [row.productId, row.active]));
}

export async function getInactiveProductIds(): Promise<string[]> {
  const rows = await getProductVisibilityRowsCached();
  return rows.filter((row) => !row.active).map((row) => row.productId);
}

export function isProductActiveOnStorefront(
  productId: string,
  visibility: Record<string, boolean>,
): boolean {
  // Honor explicit false on the canonical id or any legacy alias.
  for (const id of productIdVariants(productId)) {
    if (visibility[id] === false) return false;
  }
  return true;
}

export function filterProductsByStorefrontVisibility(
  list: Product[],
  visibility: Record<string, boolean>,
): Product[] {
  return list.filter((product) =>
    isStorefrontProductVisible(product, visibility),
  );
}

export async function isProductVisibleOnStorefront(
  productId: string,
): Promise<boolean> {
  const canonicalId = resolveProductId(productId);
  const product = products.find((item) => item.id === canonicalId);
  if (product && isProductTypeHiddenFromStorefront(product.type)) {
    return false;
  }
  const visibility = await getProductVisibilityRecord();
  return isProductActiveOnStorefront(canonicalId, visibility);
}

export async function getStorefrontBrowsableProducts(): Promise<Product[]> {
  const visibility = await getProductVisibilityRecord();
  return filterProductsByStorefrontVisibility(
    products.filter(isBrowsableProduct),
    visibility,
  );
}

export async function getVisibleProductTypes(): Promise<ProductType[]> {
  const visibility = await getProductVisibilityRecord();
  const visible = new Set<ProductType>();
  for (const product of products) {
    if (
      isBrowsableProduct(product) &&
      isProductActiveOnStorefront(product.id, visibility)
    ) {
      visible.add(product.type);
    }
  }
  return productTypes.filter(
    (type) => visible.has(type) && !isProductTypeHiddenFromStorefront(type),
  );
}
