import type { Product } from '@/lib/data/catalog';
import type { MockupDisplayVariant } from '@/lib/products/product-mockup-layout';

const POLO_MOCKUP_DIR = '/polo';

export const POLO_MOCKUP_ASSET_VERSION = 2;

/** Catalog / design cards — slightly above unisex bela (1.47) to offset narrower polo silhouette. */
export const POLO_MOCKUP_CATALOG_SCALE = 1.6;

/** Interactive customizer — fill frame without clipping collar or hem. */
export const POLO_MOCKUP_CUSTOMIZER_SCALE = 1.2;

export function isPoloProduct(product: Product): boolean {
  return product.id === 'polo-frut-original-white';
}

export function getPoloMockupPath(side: 'front' | 'back'): string {
  return `${POLO_MOCKUP_DIR}/bela-${side}.jpg?v=${POLO_MOCKUP_ASSET_VERSION}`;
}

export function getPoloMockupScale(
  variant: MockupDisplayVariant,
): number {
  return variant === 'customizer'
    ? POLO_MOCKUP_CUSTOMIZER_SCALE
    : POLO_MOCKUP_CATALOG_SCALE;
}
