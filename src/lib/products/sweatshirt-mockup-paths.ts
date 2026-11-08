import type { Product, ProductColorImages } from '@/lib/data/catalog';
import {
  HOODIE_COLOR_GRAY,
  HOODIE_COLOR_HEXES,
  HOODIE_COLOR_WHITE,
} from '@/lib/products/hoodie-catalog';

export const SWEATSHIRT_STYLES = [
  'crewneck',
  'quarter-zip',
  'full-zip',
] as const;

export type SweatshirtStyle = (typeof SWEATSHIRT_STYLES)[number];

export const SWEATSHIRT_MOCKUP_ASSET_VERSION = 1;

export const SWEATSHIRT_COLOR_HEXES: string[] = [...HOODIE_COLOR_HEXES];

/** Bump when JPG mockups are regenerated. */
export function getSweatshirtMockupPath(
  style: SweatshirtStyle,
  slug: 'bela' | 'crna',
  side: 'front' | 'back',
): string {
  return `/hoodies/${style}/${slug}-${side}.jpg?v=${SWEATSHIRT_MOCKUP_ASSET_VERSION}`;
}

function sweatshirtSlugForColor(hex: string): 'bela' | 'crna' {
  const normalized = hex.trim().toLowerCase();
  if (normalized === HOODIE_COLOR_WHITE || normalized === HOODIE_COLOR_GRAY) {
    return 'bela';
  }
  return 'crna';
}

export function buildSweatshirtColorImages(
  style: SweatshirtStyle,
): ProductColorImages {
  const images: ProductColorImages = {};
  for (const hex of HOODIE_COLOR_HEXES) {
    const slug = sweatshirtSlugForColor(hex);
    images[hex] = {
      front: getSweatshirtMockupPath(style, slug, 'front'),
      back: getSweatshirtMockupPath(style, slug, 'back'),
    };
  }
  return images;
}

export function isSweatshirtStyleProduct(product: Product): boolean {
  return (
    product.id === 'hoodie-crewneck' ||
    product.id === 'hoodie-quarter-zip' ||
    product.id === 'hoodie-full-zip'
  );
}
