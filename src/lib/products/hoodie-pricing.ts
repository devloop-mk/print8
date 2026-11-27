import type { Product } from '@/lib/data/catalog';
import { isHoodieProduct } from '@/lib/products/hoodie-catalog';
import {
  TSHIRT_BACK_PRINT_SURCHARGE,
  TSHIRT_FRONT_TIER_PRICES,
  getPrintPackageTiers,
  isTshirtPrintPackage,
  type PrintTier,
  type TshirtPrintPackage,
} from '@/lib/products/tshirt-print-pricing';

/** 4XL is +100 MKD; 5XL and 6XL are +300 MKD vs the sale base. */
export function getHoodieSizeSurcharge(size?: string | null): number {
  const normalized = (size ?? '').trim().toUpperCase();
  if (normalized === '4XL') return 100;
  if (normalized === '5XL' || normalized === '6XL') return 300;
  return 0;
}

/**
 * Catalog `basePrice` is a small front logo (≈15×15 cm).
 * Larger prints use the same MKD steps as the t-shirt cenovnik.
 */
const HOODIE_FRONT_PRINT_STEP: Record<PrintTier, number> = {
  small: 0,
  medium: TSHIRT_FRONT_TIER_PRICES.medium - TSHIRT_FRONT_TIER_PRICES.small,
  large: TSHIRT_FRONT_TIER_PRICES.large - TSHIRT_FRONT_TIER_PRICES.small,
};

/** Extra charged when a second side is printed. One side alone uses the front steps. */
export function getHoodiePrintAddon(
  printPackage?: TshirtPrintPackage | string | null,
): number {
  if (!printPackage || !isTshirtPrintPackage(printPackage) || printPackage === 'blank') {
    return 0;
  }

  const { front, back } = getPrintPackageTiers(printPackage);
  let addon = 0;
  if (front) addon += HOODIE_FRONT_PRINT_STEP[front];
  else if (back) addon += HOODIE_FRONT_PRINT_STEP[back];
  if (front && back) addon += TSHIRT_BACK_PRINT_SURCHARGE[back];
  return addon;
}

export function getHoodieUnitPrice(
  product: Product,
  size?: string | null,
  printPackage?: TshirtPrintPackage | string | null,
): number {
  return (
    product.basePrice +
    getHoodiePrintAddon(printPackage) +
    getHoodieSizeSurcharge(size)
  );
}

export function getHoodieCompareAtPrice(
  product: Product,
  size?: string | null,
  printPackage?: TshirtPrintPackage | string | null,
): number | null {
  if (!product.compareAtPrice || product.compareAtPrice <= product.basePrice) {
    return null;
  }
  return (
    product.compareAtPrice +
    getHoodiePrintAddon(printPackage) +
    getHoodieSizeSurcharge(size)
  );
}

export function getHoodiePriceFromMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
  product: Product,
): number | null {
  if (!metadata) return null;
  const size = typeof metadata.size === 'string' ? metadata.size : undefined;
  const raw = metadata.printPackage;
  const printPackage = typeof raw === 'string' ? raw : undefined;
  return getHoodieUnitPrice(product, size, printPackage);
}

export function getProductUnitPrice(
  product: Product,
  size?: string | null,
): number {
  if (isHoodieProduct(product)) return getHoodieUnitPrice(product, size);
  return product.basePrice;
}
