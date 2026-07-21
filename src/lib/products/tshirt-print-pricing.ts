import type { Product, ProductSide } from '@/lib/data/catalog';
import {
  TSHIRT_PRINT_AREA_INSETS,
  WOMEN_TSHIRT_PRINT_AREA_INSETS,
  WOMEN_TSHIRT_SMALL_PRINT_AREA_INSETS,
  getPrintAreaHeightPercent,
  getPrintAreaWidthPercent,
  type PrintAreaInsets,
} from '@/lib/products/print-area';

export const TSHIRT_PRINT_PACKAGES = [
  'front-small',
  'front-large',
  'front-small-back-small',
  'front-small-back-large',
  'front-large-back-small',
  'front-large-back-large',
  /** @deprecated Legacy dual-side key; priced like front-large-back-large. */
  'front-back',
] as const;

export type TshirtPrintPackage = (typeof TSHIRT_PRINT_PACKAGES)[number];

/**
 * Unit prices in MKD.
 *
 * Front-only tiers unchanged. Dual-side splits the old flat `front-back` (700)
 * into size combinations. Small-back duals are inferred as +150 over the
 * matching front-only tier (large-back duals are +200, matching the specified
 * 650 / 700 big-back prices).
 */
const TSHIRT_PACKAGE_PRICES: Record<TshirtPrintPackage, number> = {
  'front-small': 450,
  'front-large': 500,
  'front-small-back-small': 600,
  'front-small-back-large': 650,
  'front-large-back-small': 650,
  'front-large-back-large': 700,
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

  const frontIsSmall =
    pkg === 'front-small' || pkg.startsWith('front-small-');

  if (frontIsSmall && side === 'front') {
    return isWomen
      ? WOMEN_TSHIRT_SMALL_PRINT_AREA_INSETS
      : TSHIRT_SMALL_PRINT_AREA_INSETS;
  }

  return isWomen ? WOMEN_TSHIRT_PRINT_AREA_INSETS : TSHIRT_PRINT_AREA_INSETS;
}

export function tshirtPackageAllowsBack(pkg: TshirtPrintPackage): boolean {
  return pkg.includes('back');
}

export interface TshirtContentFootprint {
  /** % of the mockup's own width/height (same coordinate space as PrintAreaInsets). */
  width: number;
  height: number;
}

/**
 * Extra room (as a multiplier) beyond the small print zone that still
 * counts as "small" — avoids the price tier flip-flopping for designs that
 * sit right on the boundary between the two front zones.
 */
const SMALL_FOOTPRINT_TOLERANCE = 1.1;

/** True when the footprint fits inside the small chest-logo zone (+ tolerance). */
export function footprintFitsSmallZone(
  footprint: TshirtContentFootprint | null | undefined,
  isWomen?: boolean,
): boolean {
  if (!footprint) return false;

  const smallInsets = isWomen
    ? WOMEN_TSHIRT_SMALL_PRINT_AREA_INSETS
    : TSHIRT_SMALL_PRINT_AREA_INSETS;
  const maxSmallWidth =
    getPrintAreaWidthPercent(smallInsets) * SMALL_FOOTPRINT_TOLERANCE;
  const maxSmallHeight =
    getPrintAreaHeightPercent(smallInsets) * SMALL_FOOTPRINT_TOLERANCE;

  return (
    footprint.width <= maxSmallWidth && footprint.height <= maxSmallHeight
  );
}

/**
 * Auto-detects the print package from what the user actually placed instead
 * of asking them to pick a package up front:
 * - no back content → front-small / front-large from the front footprint
 * - back content → dual package from front + back small/large classification
 * - missing footprint on a side defaults to large (safe / matches prior defaults)
 */
export function deriveTshirtPrintPackage({
  hasBackContent,
  frontFootprint,
  backFootprint,
  isWomen,
}: {
  hasBackContent: boolean;
  frontFootprint: TshirtContentFootprint | null;
  backFootprint?: TshirtContentFootprint | null;
  isWomen?: boolean;
}): TshirtPrintPackage {
  const frontSmall = footprintFitsSmallZone(frontFootprint, isWomen);

  if (!hasBackContent) {
    return frontSmall ? 'front-small' : 'front-large';
  }

  const backSmall = footprintFitsSmallZone(backFootprint, isWomen);

  if (frontSmall && backSmall) return 'front-small-back-small';
  if (frontSmall && !backSmall) return 'front-small-back-large';
  if (!frontSmall && backSmall) return 'front-large-back-small';
  return 'front-large-back-large';
}
