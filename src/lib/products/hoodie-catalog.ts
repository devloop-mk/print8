import type { Product, ProductColorImages } from '@/lib/data/catalog';

/** Siva, crna, teget, bela, plava mastilo, crvena */
export const HOODIE_COLOR_GRAY = '#6b7280';
export const HOODIE_COLOR_BLACK = '#1c1a1d';
export const HOODIE_COLOR_NAVY = '#1e293b';
export const HOODIE_COLOR_WHITE = '#ffffff';
export const HOODIE_COLOR_INK = '#0f287c';
export const HOODIE_COLOR_RED = '#dc2626';

export const HOODIE_COLOR_HEXES: string[] = [
  HOODIE_COLOR_GRAY,
  HOODIE_COLOR_BLACK,
  HOODIE_COLOR_NAVY,
  HOODIE_COLOR_WHITE,
  HOODIE_COLOR_INK,
  HOODIE_COLOR_RED,
];

export const HOODIE_SIZES = [
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '4XL',
  '5XL',
  '6XL',
] as const;

export type HoodieSize = (typeof HOODIE_SIZES)[number];

const WHITE_SIDES = {
  front: '/hoodies/hoodie-white.jpg',
  back: '/hoodies/hoodie-white-back.jpg',
} as const;

const HOODIE_GENERATED_MOCKUP_VERSION = 2;

function generatedHoodieSides(slug: string) {
  const version = `?v=${HOODIE_GENERATED_MOCKUP_VERSION}`;
  return {
    front: `/hoodies/generated/hoodie-${slug}-front.jpg${version}`,
    back: `/hoodies/generated/hoodie-${slug}-back.jpg${version}`,
  };
}

/** New catalog photos per swatch. The original white blank is unchanged. */
export function buildHoodieBasicColorImages(): ProductColorImages {
  return {
    [HOODIE_COLOR_WHITE]: WHITE_SIDES,
    [HOODIE_COLOR_GRAY]: generatedHoodieSides('siva'),
    [HOODIE_COLOR_BLACK]: generatedHoodieSides('crna'),
    [HOODIE_COLOR_NAVY]: generatedHoodieSides('teget'),
    [HOODIE_COLOR_RED]: generatedHoodieSides('crvena'),
    [HOODIE_COLOR_INK]: generatedHoodieSides('mastilo'),
  };
}

export function isHoodieProduct(product: Product): boolean {
  return product.type === 'hoodie';
}

export function isWhiteHoodedKangaroo(
  product: Product,
  color: string,
): boolean {
  return product.id === 'hoodie-basic' && color.trim().toLowerCase() === HOODIE_COLOR_WHITE;
}
