import type { Product, ProductSide } from '@/lib/data/catalog';
import {
  getBagStartingPrice,
  isBagProduct,
} from '@/lib/products/bag-print-pricing';
import {
  TSHIRT_PRINT_AREA_INSETS,
  WOMEN_TSHIRT_PRINT_AREA_INSETS,
  WOMEN_TSHIRT_SMALL_PRINT_AREA_INSETS,
  getPrintAreaHeightPercent,
  getPrintAreaWidthPercent,
  type PrintAreaInsets,
} from '@/lib/products/print-area';

export type PrintTier = 'small' | 'medium' | 'large';

/** Per-product overrides for t-shirt / polo pricing (MKD). */
export interface TshirtPricingOverride {
  blank?: number;
  front?: Partial<Record<PrintTier, number>>;
  backSurcharge?: Partial<Record<PrintTier, number>>;
}

export const TSHIRT_PRINT_PACKAGES = [
  'blank',
  'front-small',
  'front-medium',
  'front-large',
  'back-small',
  'back-medium',
  'back-large',
  'front-small-back-small',
  'front-small-back-medium',
  'front-small-back-large',
  'front-medium-back-small',
  'front-medium-back-medium',
  'front-medium-back-large',
  'front-large-back-small',
  'front-large-back-medium',
  'front-large-back-large',
  /** @deprecated Legacy dual-side key — priced like front-large-back-large. */
  'front-back',
  /** @deprecated Legacy mixed dual keys — kept for cart metadata compatibility. */
  'front-small-back-large',
  'front-large-back-small',
  'front-large-back-large',
] as const;

export type TshirtPrintPackage = (typeof TSHIRT_PRINT_PACKAGES)[number];

/** Garment-only (no print). */
export const TSHIRT_BLANK_PRICE = 350;

/** Front print tiers (MKD) — mal / sredno / golemo logo. */
export const TSHIRT_FRONT_TIER_PRICES: Record<PrintTier, number> = {
  small: 500,
  medium: 600,
  large: 750,
};

/** Back-print supplement when front is also printed (MKD). */
export const TSHIRT_BACK_PRINT_SURCHARGE: Record<PrintTier, number> = {
  small: 50,
  medium: 100,
  large: 200,
};

/** @deprecated Prefer getTshirtUnitPrice — static matrix no longer used for all tiers. */
export const TSHIRT_PRINT_PACKAGE_PRICES: Record<TshirtPrintPackage, number> = {
  blank: TSHIRT_BLANK_PRICE,
  'front-small': TSHIRT_FRONT_TIER_PRICES.small,
  'front-medium': TSHIRT_FRONT_TIER_PRICES.medium,
  'front-large': TSHIRT_FRONT_TIER_PRICES.large,
  'back-small': TSHIRT_BLANK_PRICE + TSHIRT_BACK_PRINT_SURCHARGE.small,
  'back-medium': TSHIRT_BLANK_PRICE + TSHIRT_BACK_PRINT_SURCHARGE.medium,
  'back-large': TSHIRT_BLANK_PRICE + TSHIRT_BACK_PRINT_SURCHARGE.large,
  'front-small-back-small':
    TSHIRT_FRONT_TIER_PRICES.small + TSHIRT_BACK_PRINT_SURCHARGE.small,
  'front-small-back-medium':
    TSHIRT_FRONT_TIER_PRICES.small + TSHIRT_BACK_PRINT_SURCHARGE.medium,
  'front-small-back-large':
    TSHIRT_FRONT_TIER_PRICES.small + TSHIRT_BACK_PRINT_SURCHARGE.large,
  'front-medium-back-small':
    TSHIRT_FRONT_TIER_PRICES.medium + TSHIRT_BACK_PRINT_SURCHARGE.small,
  'front-medium-back-medium':
    TSHIRT_FRONT_TIER_PRICES.medium + TSHIRT_BACK_PRINT_SURCHARGE.medium,
  'front-medium-back-large':
    TSHIRT_FRONT_TIER_PRICES.medium + TSHIRT_BACK_PRINT_SURCHARGE.large,
  'front-large-back-small':
    TSHIRT_FRONT_TIER_PRICES.large + TSHIRT_BACK_PRINT_SURCHARGE.small,
  'front-large-back-medium':
    TSHIRT_FRONT_TIER_PRICES.large + TSHIRT_BACK_PRINT_SURCHARGE.medium,
  'front-large-back-large':
    TSHIRT_FRONT_TIER_PRICES.large + TSHIRT_BACK_PRINT_SURCHARGE.large,
  'front-back':
    TSHIRT_FRONT_TIER_PRICES.large + TSHIRT_BACK_PRINT_SURCHARGE.large,
};

/** Tighter chest logo zone for small front prints (≈15×15 cm). */
export const TSHIRT_SMALL_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 30,
  right: 36,
  bottom: 40,
  left: 35,
};

/** Mid chest zone (≈25×30 cm). */
export const TSHIRT_MEDIUM_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 24,
  right: 34,
  bottom: 28,
  left: 34,
};

export const WOMEN_TSHIRT_MEDIUM_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 25,
  right: 32,
  bottom: 30,
  left: 32,
};

const SMALL_FOOTPRINT_TOLERANCE = 1.1;

export function isTshirtPrintPackage(
  value: string,
): value is TshirtPrintPackage {
  return (TSHIRT_PRINT_PACKAGES as readonly string[]).includes(value);
}

export function isTshirtProduct(product: Product): boolean {
  return product.type === 't-shirt';
}

function resolveBlankPrice(product?: Product | null): number {
  return product?.tshirtPricing?.blank ?? TSHIRT_BLANK_PRICE;
}

function resolveFrontTierPrices(product?: Product | null): Record<PrintTier, number> {
  const overrides = product?.tshirtPricing?.front;
  return {
    small: overrides?.small ?? TSHIRT_FRONT_TIER_PRICES.small,
    medium: overrides?.medium ?? TSHIRT_FRONT_TIER_PRICES.medium,
    large: overrides?.large ?? TSHIRT_FRONT_TIER_PRICES.large,
  };
}

function resolveBackSurcharge(product?: Product | null): Record<PrintTier, number> {
  const overrides = product?.tshirtPricing?.backSurcharge;
  if (
    overrides?.small !== undefined ||
    overrides?.medium !== undefined ||
    overrides?.large !== undefined
  ) {
    return {
      small: overrides?.small ?? TSHIRT_BACK_PRINT_SURCHARGE.small,
      medium: overrides?.medium ?? TSHIRT_BACK_PRINT_SURCHARGE.medium,
      large: overrides?.large ?? TSHIRT_BACK_PRINT_SURCHARGE.large,
    };
  }

  // Custom front tiers include blank + one print — back-only should match front-only.
  if (product?.tshirtPricing?.front) {
    const blank = resolveBlankPrice(product);
    const front = resolveFrontTierPrices(product);
    return {
      small: front.small - blank,
      medium: front.medium - blank,
      large: front.large - blank,
    };
  }

  return {
    small: TSHIRT_BACK_PRINT_SURCHARGE.small,
    medium: TSHIRT_BACK_PRINT_SURCHARGE.medium,
    large: TSHIRT_BACK_PRINT_SURCHARGE.large,
  };
}

function packageBackTier(pkg: TshirtPrintPackage): PrintTier | null {
  const match = pkg.match(/(?:^back-|-back-)(small|medium|large)/);
  return match ? (match[1] as PrintTier) : null;
}

export function getTshirtUnitPrice(
  pkg: TshirtPrintPackage,
  product?: Product | null,
): number {
  const blank = resolveBlankPrice(product);
  const front = resolveFrontTierPrices(product);
  const back = resolveBackSurcharge(product);

  if (pkg === 'blank') return blank;

  const frontTier = packageFrontTier(pkg);
  const backTier = packageBackTier(pkg);

  if (frontTier && backTier) {
    return front[frontTier] + back[backTier];
  }

  if (frontTier && pkg.startsWith('front-')) {
    return front[frontTier];
  }

  if (backTier && pkg.startsWith('back-')) {
    return blank + back[backTier];
  }

  if (pkg === 'front-back') {
    return front.large + back.large;
  }

  return TSHIRT_PRINT_PACKAGE_PRICES[pkg] ?? blank;
}

export function getTshirtStartingPrice(product?: Product | null): number {
  return resolveBlankPrice(product);
}

export function getProductDisplayPrice(product: Product): number {
  if (isTshirtProduct(product)) {
    return getTshirtStartingPrice(product);
  }
  if (isBagProduct(product)) {
    return getBagStartingPrice();
  }
  return product.basePrice;
}

export function getTshirtPriceFromMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
  product?: Product | null,
): number | null {
  if (!metadata) return null;

  const raw = metadata.printPackage;
  if (typeof raw !== 'string' || !isTshirtPrintPackage(raw)) {
    return null;
  }

  return getTshirtUnitPrice(raw, product);
}

export function getTshirtPrintAreaInsets(
  pkg: TshirtPrintPackage,
  side: ProductSide,
  product?: Product,
): PrintAreaInsets {
  const isWomen = product?.fit === 'women';
  const tier = packageFrontTier(pkg);

  if (side === 'front') {
    if (tier === 'small') {
      return isWomen
        ? WOMEN_TSHIRT_SMALL_PRINT_AREA_INSETS
        : TSHIRT_SMALL_PRINT_AREA_INSETS;
    }
    if (tier === 'medium') {
      return isWomen
        ? WOMEN_TSHIRT_MEDIUM_PRINT_AREA_INSETS
        : TSHIRT_MEDIUM_PRINT_AREA_INSETS;
    }
  }

  return isWomen ? WOMEN_TSHIRT_PRINT_AREA_INSETS : TSHIRT_PRINT_AREA_INSETS;
}

export function tshirtPackageAllowsBack(pkg: TshirtPrintPackage): boolean {
  return pkg === 'front-back' || pkg.includes('-back-');
}

export interface TshirtContentFootprint {
  width: number;
  height: number;
}

function footprintFitsInsets(
  footprint: TshirtContentFootprint,
  insets: PrintAreaInsets,
): boolean {
  const maxWidth =
    getPrintAreaWidthPercent(insets) * SMALL_FOOTPRINT_TOLERANCE;
  const maxHeight =
    getPrintAreaHeightPercent(insets) * SMALL_FOOTPRINT_TOLERANCE;
  return footprint.width <= maxWidth && footprint.height <= maxHeight;
}

export function classifyPrintTier(
  footprint: TshirtContentFootprint | null | undefined,
  isWomen?: boolean,
): PrintTier {
  if (!footprint) return 'large';

  const smallInsets = isWomen
    ? WOMEN_TSHIRT_SMALL_PRINT_AREA_INSETS
    : TSHIRT_SMALL_PRINT_AREA_INSETS;
  const mediumInsets = isWomen
    ? WOMEN_TSHIRT_MEDIUM_PRINT_AREA_INSETS
    : TSHIRT_MEDIUM_PRINT_AREA_INSETS;

  if (footprintFitsInsets(footprint, smallInsets)) return 'small';
  if (footprintFitsInsets(footprint, mediumInsets)) return 'medium';
  return 'large';
}

/** @deprecated Use classifyPrintTier */
export function footprintFitsSmallZone(
  footprint: TshirtContentFootprint | null | undefined,
  isWomen?: boolean,
): boolean {
  return classifyPrintTier(footprint, isWomen) === 'small';
}

function packageFrontTier(pkg: TshirtPrintPackage): PrintTier | null {
  if (pkg === 'blank') return null;
  const match = pkg.match(/^front-(small|medium|large)/);
  return match ? (match[1] as PrintTier) : null;
}

export function deriveTshirtPrintPackage({
  hasFrontContent = false,
  hasBackContent,
  frontFootprint,
  backFootprint,
  isWomen,
}: {
  hasFrontContent?: boolean;
  hasBackContent: boolean;
  frontFootprint: TshirtContentFootprint | null;
  backFootprint?: TshirtContentFootprint | null;
  isWomen?: boolean;
}): TshirtPrintPackage {
  if (!hasFrontContent && !hasBackContent) {
    return 'blank';
  }

  const frontTier = classifyPrintTier(frontFootprint, isWomen);
  const backTier = classifyPrintTier(backFootprint, isWomen);

  if (hasFrontContent && !hasBackContent) {
    return `front-${frontTier}` as TshirtPrintPackage;
  }

  if (!hasFrontContent && hasBackContent) {
    return `back-${backTier}` as TshirtPrintPackage;
  }

  return `front-${frontTier}-back-${backTier}` as TshirtPrintPackage;
}
