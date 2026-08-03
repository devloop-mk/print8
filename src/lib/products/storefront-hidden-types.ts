/** Product types temporarily hidden from the storefront (catalog, nav, customizer). */
import { productIdVariants } from '@/lib/products/product-id-aliases';

const HIDDEN_PRODUCT_TYPES = ['thermos'] as const;

export const STOREFONT_HIDDEN_PRODUCT_TYPES: readonly string[] = HIDDEN_PRODUCT_TYPES;

export function isProductTypeHiddenFromStorefront(type: string): boolean {
  return (HIDDEN_PRODUCT_TYPES as readonly string[]).includes(type);
}

export function filterStorefrontHiddenProductTypes<T extends { type: string }>(
  list: T[],
): T[] {
  return list.filter(
    (product) => !isProductTypeHiddenFromStorefront(product.type),
  );
}

export function filterProductsByInactiveIds<T extends { id: string }>(
  list: T[],
  inactiveProductIds: readonly string[],
): T[] {
  if (inactiveProductIds.length === 0) return list;
  const hidden = new Set(
    inactiveProductIds.flatMap((id) => productIdVariants(id)),
  );
  return list.filter((product) => !hidden.has(product.id));
}
