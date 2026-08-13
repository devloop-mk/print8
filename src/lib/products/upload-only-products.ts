import type { Product, ProductType } from '@/lib/data/catalog';

/** Products ordered via photo upload (no full garment/drinkware customizer). */
export const UPLOAD_ONLY_PRODUCT_TYPES = [
  'magnet',
  'photo-stone',
  'puzzle',
  'plaque',
  'gift-box',
  'microfiber-cloth',
] as const satisfies readonly ProductType[];

export type UploadOnlyProductType = (typeof UPLOAD_ONLY_PRODUCT_TYPES)[number];

export function isUploadOnlyProductType(
  type: ProductType,
): type is UploadOnlyProductType {
  return (UPLOAD_ONLY_PRODUCT_TYPES as readonly string[]).includes(type);
}

export function isUploadOnlyProduct(product: Product): boolean {
  return isUploadOnlyProductType(product.type);
}
