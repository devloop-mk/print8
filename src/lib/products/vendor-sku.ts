import type { Product } from '@/lib/data/catalog';
import { getProductById } from '@/lib/cart/product-cart';

/** Koni / supplier SKU — internal only, never shown on storefront cards. */
export function getProductVendorSku(
  product: Product | undefined | null,
): string | undefined {
  const sku = product?.vendorSku?.trim();
  return sku || undefined;
}

export function getVendorSkuForProductId(
  productId: string | undefined,
): string | undefined {
  if (!productId) return undefined;
  return getProductVendorSku(getProductById(productId));
}

export function withVendorSkuMetadata(
  metadata: Record<string, string | number | boolean>,
  product: Product | undefined | null,
): Record<string, string | number | boolean> {
  const sku = getProductVendorSku(product);
  if (sku) metadata.vendorSku = sku;
  return metadata;
}
