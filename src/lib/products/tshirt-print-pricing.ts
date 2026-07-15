import type { Product, ProductSide } from '@/lib/data/catalog';
import {
  TSHIRT_PRINT_AREA_INSETS,
  WOMEN_TSHIRT_PRINT_AREA_INSETS,
  WOMEN_TSHIRT_SMALL_PRINT_AREA_INSETS,
  type PrintAreaInsets,
} from '@/lib/products/print-area';

export const TSHIRT_PRINT_PACKAGES = [
  'front-small',
  'front-large',
  'front-back',
] as const;

export type TshirtPrintPackage = (typeof TSHIRT_PRINT_PACKAGES)[number];

const TSHIRT_PACKAGE_PRICES: Record<TshirtPrintPackage, number> = {
  'front-small': 450,
  'front-large': 500,
  'front-back': 700,
};

/** Tighter chest logo zone for small front prints. */
export const TSHIRT_SMALL_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 30,
  right: 36,
  bottom: 40,
  left: 35,
};

export function isTshirtPrintPackage(
  value: string,
): value is TshirtPrintPackage {
  return (TSHIRT_PRINT_PACKAGES as readonly string[]).includes(value);
}

export function isTshirtProduct(product: Product): boolean {
  return product.type === 't-shirt';
}

export function getTshirtUnitPrice(pkg: TshirtPrintPackage): number {
  return TSHIRT_PACKAGE_PRICES[pkg];
}

export function getTshirtStartingPrice(): number {
  return TSHIRT_PACKAGE_PRICES['front-small'];
}

export function getProductDisplayPrice(product: Product): number {
  if (isTshirtProduct(product)) {
    return getTshirtStartingPrice();
  }
  return product.basePrice;
}

export function getTshirtPriceFromMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
): number | null {
  if (!metadata) return null;

  const raw = metadata.printPackage;
  if (typeof raw !== 'string' || !isTshirtPrintPackage(raw)) {
    return null;
  }

  return getTshirtUnitPrice(raw);
}

export function getTshirtPrintAreaInsets(
  pkg: TshirtPrintPackage,
  side: ProductSide,
  product?: Product,
): PrintAreaInsets {
  const isWomen = product?.fit === 'women';

  if (pkg === 'front-small' && side === 'front') {
    return isWomen
      ? WOMEN_TSHIRT_SMALL_PRINT_AREA_INSETS
      : TSHIRT_SMALL_PRINT_AREA_INSETS;
  }

  return isWomen ? WOMEN_TSHIRT_PRINT_AREA_INSETS : TSHIRT_PRINT_AREA_INSETS;
}

export function tshirtPackageAllowsBack(pkg: TshirtPrintPackage): boolean {
  return pkg === 'front-back';
}
