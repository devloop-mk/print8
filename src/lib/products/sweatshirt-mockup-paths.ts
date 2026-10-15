import type { Product, ProductColorImages } from '@/lib/data/catalog';

export const SWEATSHIRT_STYLES = [
  'crewneck',
  'quarter-zip',
  'full-zip',
] as const;

export type SweatshirtStyle = (typeof SWEATSHIRT_STYLES)[number];

export const SWEATSHIRT_MOCKUP_ASSET_VERSION = 1;

const WHITE = '#ffffff';
const BLACK = '#1c1a1d';

export const SWEATSHIRT_COLOR_HEXES: string[] = [WHITE, BLACK];

/** Bump when JPG mockups are regenerated. */
export function getSweatshirtMockupPath(
  style: SweatshirtStyle,
  slug: 'bela' | 'crna',
  side: 'front' | 'back',
): string {
  return `/hoodies/${style}/${slug}-${side}.jpg?v=${SWEATSHIRT_MOCKUP_ASSET_VERSION}`;
}

export function buildSweatshirtColorImages(
  style: SweatshirtStyle,
): ProductColorImages {
  return {
    [WHITE]: {
      front: getSweatshirtMockupPath(style, 'bela', 'front'),
      back: getSweatshirtMockupPath(style, 'bela', 'back'),
    },
    [BLACK]: {
      front: getSweatshirtMockupPath(style, 'crna', 'front'),
      back: getSweatshirtMockupPath(style, 'crna', 'back'),
    },
  };
}

export function isSweatshirtStyleProduct(product: Product): boolean {
  return (
    product.id === 'hoodie-crewneck' ||
    product.id === 'hoodie-quarter-zip' ||
    product.id === 'hoodie-full-zip'
  );
}
