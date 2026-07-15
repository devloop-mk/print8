import type { ProductColorImages } from '@/lib/data/catalog';
import { normalizeHex } from '@/lib/products/design-overlay';

/** Supplier stock ref + exact fabric hex from the color chart. */
export type TshirtWomenColor = {
  hex: string;
  labelKey: string;
  /** Filename slug under public/t-shirts/women/ */
  slug: string;
};

/** Women's fitted short-sleeve tee — white & black only (Russell SR-17396). */
export const TSHIRT_WOMEN_COLORS: TshirtWomenColor[] = [
  { hex: '#ffffff', labelKey: 'white', slug: 'bela' },
  { hex: '#000000', labelKey: 'black', slug: 'crna' },
];

export const TSHIRT_WOMEN_COLOR_HEXES = TSHIRT_WOMEN_COLORS.map((c) =>
  normalizeHex(c.hex),
);

const WOMEN_MOCKUP_DIR = '/t-shirts/women';

/** Bump when women's JPG mockups are regenerated (cache-busts immutable CDN/browser cache). */
export const WOMEN_MOCKUP_ASSET_VERSION = 1;

/**
 * Portrait photo mockups already fill most of the frame — only mild zoom for
 * square catalog cards. Customizer uses ~1 so the full shirt stays visible.
 */
const WOMEN_MOCKUP_CATALOG_SCALE: Record<string, number> = {
  bela: 1.08,
  crna: 1.12,
};

const WOMEN_MOCKUP_CUSTOMIZER_SCALE: Record<string, number> = {
  bela: 1,
  crna: 1.02,
};

export function getWomenTshirtCatalogScaleFromMockup(mockupPath: string): number {
  const match = mockupPath.match(/\/women\/([^-]+)-/);
  if (!match) return 1.1;
  return WOMEN_MOCKUP_CATALOG_SCALE[match[1]] ?? 1.1;
}

export function getWomenTshirtCustomizerScaleFromMockup(
  mockupPath: string,
): number {
  const match = mockupPath.match(/\/women\/([^-]+)-/);
  if (!match) return 1;
  return WOMEN_MOCKUP_CUSTOMIZER_SCALE[match[1]] ?? 1;
}

export function getWomenTshirtMockupPath(
  slug: string,
  side: 'front' | 'back',
): string {
  return `${WOMEN_MOCKUP_DIR}/${slug}-${side}.jpg?v=${WOMEN_MOCKUP_ASSET_VERSION}`;
}

export function buildWomenTshirtColorImages(): ProductColorImages {
  const images: ProductColorImages = {};

  for (const color of TSHIRT_WOMEN_COLORS) {
    images[normalizeHex(color.hex)] = {
      front: getWomenTshirtMockupPath(color.slug, 'front'),
      back: getWomenTshirtMockupPath(color.slug, 'back'),
    };
  }

  return images;
}
