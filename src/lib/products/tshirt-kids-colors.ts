import type { ProductColorImages } from '@/lib/data/catalog';
import { normalizeHex } from '@/lib/products/design-overlay';

/** Kids short-sleeve tee colors from supplier chart (shirts 4, 12, 19). */
export type TshirtKidsColor = {
  hex: string;
  labelKey: string;
  /** Filename slug under public/t-shirts/kids/ */
  slug: string;
};

/**
 * Children's tee — chart colors + white:
 * Бела, 4 Небесно плава, 12 Жолта, 19 Минт
 */
export const TSHIRT_KIDS_COLORS: TshirtKidsColor[] = [
  { hex: '#ffffff', labelKey: 'white', slug: 'bela' },
  { hex: '#7891B7', labelKey: 'skyBlue', slug: 'nebesno-plava' },
  { hex: '#FDC101', labelKey: 'yellow', slug: 'zolta' },
  { hex: '#9ACDCA', labelKey: 'mint', slug: 'mint' },
];

export const TSHIRT_KIDS_COLOR_HEXES = TSHIRT_KIDS_COLORS.map((c) =>
  normalizeHex(c.hex),
);

const KIDS_MOCKUP_DIR = '/t-shirts/kids';

/** Bump when kids JPG mockups are regenerated. */
export const KIDS_MOCKUP_ASSET_VERSION = 3;

const KIDS_MOCKUP_CATALOG_SCALE: Record<string, number> = {
  bela: 1.08,
  'nebesno-plava': 1.08,
  zolta: 1.08,
  mint: 1.08,
};

const KIDS_MOCKUP_CUSTOMIZER_SCALE: Record<string, number> = {
  bela: 1,
  'nebesno-plava': 1,
  zolta: 1,
  mint: 1,
};

export function getKidsTshirtCatalogScaleFromMockup(mockupPath: string): number {
  const match = mockupPath.match(/\/kids\/(.+)-(?:front|back)/);
  if (!match) return 1.08;
  return KIDS_MOCKUP_CATALOG_SCALE[match[1]] ?? 1.08;
}

export function getKidsTshirtCustomizerScaleFromMockup(
  mockupPath: string,
): number {
  const match = mockupPath.match(/\/kids\/(.+)-(?:front|back)/);
  if (!match) return 1;
  return KIDS_MOCKUP_CUSTOMIZER_SCALE[match[1]] ?? 1;
}

export function getKidsTshirtMockupPath(
  slug: string,
  side: 'front' | 'back',
): string {
  return `${KIDS_MOCKUP_DIR}/${slug}-${side}.jpg?v=${KIDS_MOCKUP_ASSET_VERSION}`;
}

export function buildKidsTshirtColorImages(): ProductColorImages {
  const images: ProductColorImages = {};

  for (const color of TSHIRT_KIDS_COLORS) {
    images[normalizeHex(color.hex)] = {
      front: getKidsTshirtMockupPath(color.slug, 'front'),
      back: getKidsTshirtMockupPath(color.slug, 'back'),
    };
  }

  return images;
}
