import type { Product } from '@/lib/data/catalog';
import { resolveOverlayPlacementForSide } from '@/lib/products/design-overlay';
import type { ProductDesignTemplate, ProductSide } from '@/lib/data/catalog';
import { getDrinkwareSublimationPatch } from '@/lib/products/drinkware-sublimation-patch';
import {
  isCylindricalDrinkwareType,
  shouldUseDrinkwareWrapDesignPreview,
} from '@/lib/products/product-mockup-layout';
import type { OverlayPlacement } from '@/lib/products/design-overlay';

export type DrinkwarePrintTier = 'half' | 'full';

/** Per-product half / full wrap prices (MKD) — matches cenovnik “пола / цела чаша”. */
export interface DrinkwarePricingOverride {
  half: number;
  full: number;
}

export function isDrinkwareProduct(product: Product): boolean {
  return isCylindricalDrinkwareType(product.type);
}

export function getDrinkwareTierPrices(
  product: Product,
): DrinkwarePricingOverride | null {
  if (!product.drinkwarePricing) return null;
  return product.drinkwarePricing;
}

/** Classify live customizer art as half-mug vs full-wrap pricing. */
export function classifyDrinkwarePrintTier(
  product: Product,
  placement: OverlayPlacement,
): DrinkwarePrintTier {
  if (getDrinkwareSublimationPatch(product.id)) return 'half';
  if (shouldUseDrinkwareWrapDesignPreview(product, placement)) return 'full';
  return 'half';
}

/** Premade overlay/image designs — wrap-sized art uses full-mug price. */
export function classifyDrinkwarePrintTierFromTemplate(
  product: Product,
  design: ProductDesignTemplate,
  side: ProductSide = design.defaultSide ?? 'front',
): DrinkwarePrintTier {
  if (getDrinkwareSublimationPatch(product.id)) return 'half';
  const placement = resolveOverlayPlacementForSide(design, side, product);
  return classifyDrinkwarePrintTier(product, placement);
}

export function getDrinkwareUnitPrice(
  product: Product,
  tier: DrinkwarePrintTier,
): number {
  const tiers = getDrinkwareTierPrices(product);
  if (tiers) return tier === 'full' ? tiers.full : tiers.half;
  return product.basePrice;
}

export function getDrinkwareStartingPrice(product: Product): number {
  const tiers = getDrinkwareTierPrices(product);
  if (tiers) return tiers.half;
  return product.basePrice;
}
