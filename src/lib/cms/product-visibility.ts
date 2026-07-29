import { unstable_cache } from 'next/cache';
import {
  isBrowsableProduct,
  products,
  productTypes,
  type Product,
  type ProductType,
} from '@/lib/data/catalog';
import { productVisibilityDb } from '@/lib/db/product-visibility';

export const PRODUCT_VISIBILITY_CACHE_TAG = 'cms-product-visibility';

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
  return visibility[productId] !== false;
}

export function filterProductsByStorefrontVisibility(
  list: Product[],
  visibility: Record<string, boolean>,
): Product[] {
  return list.filter((product) =>
    isProductActiveOnStorefront(product.id, visibility),
  );
}

export async function isProductVisibleOnStorefront(
  productId: string,
): Promise<boolean> {
  const visibility = await getProductVisibilityRecord();
  return isProductActiveOnStorefront(productId, visibility);
}

export async function getStorefrontBrowsableProducts(): Promise<Product[]> {
  const visibility = await getProductVisibilityRecord();
  return filterProductsByStorefrontVisibility(
    products.filter(isBrowsableProduct),
    visibility,
  );
}

export function filterProductsByInactiveIds(
  list: Product[],
  inactiveProductIds: readonly string[],
): Product[] {
  if (inactiveProductIds.length === 0) return list;
  const hidden = new Set(inactiveProductIds);
  return list.filter((product) => !hidden.has(product.id));
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
  return productTypes.filter((type) => visible.has(type));
}
