import type { Product } from '@/lib/data/catalog';
import { isHoodieProduct } from '@/lib/products/hoodie-catalog';

/** 4XL is +100 MKD; 5XL and 6XL are +300 MKD vs the sale base. */
export function getHoodieSizeSurcharge(size?: string | null): number {
  const normalized = (size ?? '').trim().toUpperCase();
  if (normalized === '4XL') return 100;
  if (normalized === '5XL' || normalized === '6XL') return 300;
  return 0;
}

export function getHoodieUnitPrice(
  product: Product,
  size?: string | null,
): number {
  return product.basePrice + getHoodieSizeSurcharge(size);
}

export function getHoodieCompareAtPrice(
  product: Product,
  size?: string | null,
): number | null {
  if (!product.compareAtPrice || product.compareAtPrice <= product.basePrice) {
    return null;
  }
  return product.compareAtPrice + getHoodieSizeSurcharge(size);
}

export function getProductUnitPrice(
  product: Product,
  size?: string | null,
): number {
  if (isHoodieProduct(product)) return getHoodieUnitPrice(product, size);
  return product.basePrice;
}
