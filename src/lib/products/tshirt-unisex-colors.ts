import type { ProductColorImages } from '@/lib/data/catalog';
import { normalizeHex } from '@/lib/products/design-overlay';

/** Supplier stock ref + exact fabric hex from the color chart. */
export type TshirtUnisexColor = {
  hex: string;
  labelKey: string;
  supplierRef: number;
  /** Filename slug under public/t-shirts/unisex/ */
  slug: string;
};

/** Unisex short-sleeve tee — 9 supplier colors. */
export const TSHIRT_UNISEX_COLORS: TshirtUnisexColor[] = [
  { hex: '#c5ccd6', labelKey: 'white', supplierRef: 1, slug: 'bela' },
  { hex: '#1C1A1D', labelKey: 'black', supplierRef: 2, slug: 'crna' },
  { hex: '#DB0213', labelKey: 'red', supplierRef: 3, slug: 'crvena' },
  { hex: '#272D37', labelKey: 'navy', supplierRef: 4, slug: 'teget' },
  { hex: '#00806A', labelKey: 'green', supplierRef: 5, slug: 'zelena' },
  { hex: '#A09FA4', labelKey: 'gray', supplierRef: 6, slug: 'siva' },
  { hex: '#0F287C', labelKey: 'royalBlue', supplierRef: 7, slug: 'mastilo' },
  { hex: '#79804C', labelKey: 'olive', supplierRef: 8, slug: 'maslinova' },
  { hex: '#CEB499', labelKey: 'cream', supplierRef: 9, slug: 'krem' },
];

export const TSHIRT_UNISEX_COLOR_HEXES = TSHIRT_UNISEX_COLORS.map((c) =>
  normalizeHex(c.hex),
);

const UNISEX_MOCKUP_DIR = '/t-shirts/unisex';

/** Bump when unisex JPG mockups are regenerated (cache-busts immutable CDN/browser cache). */
export const UNISEX_MOCKUP_ASSET_VERSION = 3;

/**
 * Compensate for landscape photo mockups (1536×1024) where the shirt fills
 * ~62–72% of a square preview vs ~91% on the legacy square PNG mockups.
 * Catalog cards can zoom aggressively; the customizer must stay near 1 so the
 * full shirt stays visible inside the canvas.
 */
const UNISEX_MOCKUP_CATALOG_SCALE: Record<string, number> = {
  bela: 1.47,
  crna: 1.34,
  crvena: 1.37,
  teget: 1.36,
  zelena: 1.41,
  siva: 1.4,
  mastilo: 1.36,
  maslinova: 1.38,
  krem: 1.36,
};

/** Bigger than 1, but below catalog zoom so collar/hem stay on-screen. */
const UNISEX_MOCKUP_CUSTOMIZER_SCALE: Record<string, number> = {
  bela: 1.28,
  crna: 1.22,
  crvena: 1.24,
  teget: 1.24,
  zelena: 1.26,
  siva: 1.22,
  mastilo: 1.24,
  maslinova: 1.24,
  krem: 1.24,
};

export function getUnisexTshirtCatalogScaleFromMockup(mockupPath: string): number {
  const match = mockupPath.match(/\/unisex\/([^-]+)-/);
  if (!match) return 1.37;
  return UNISEX_MOCKUP_CATALOG_SCALE[match[1]] ?? 1.37;
}

export function getUnisexTshirtCustomizerScaleFromMockup(
  mockupPath: string,
): number {
  const match = mockupPath.match(/\/unisex\/([^-]+)-/);
  if (!match) return 1.24;
  return UNISEX_MOCKUP_CUSTOMIZER_SCALE[match[1]] ?? 1.24;
}

export function getUnisexTshirtMockupPath(
  slug: string,
  side: 'front' | 'back',
): string {
  return `${UNISEX_MOCKUP_DIR}/${slug}-${side}.jpg?v=${UNISEX_MOCKUP_ASSET_VERSION}`;
}

export function buildUnisexTshirtColorImages(): ProductColorImages {
  const images: ProductColorImages = {};

  for (const color of TSHIRT_UNISEX_COLORS) {
    images[normalizeHex(color.hex)] = {
      front: getUnisexTshirtMockupPath(color.slug, 'front'),
      back: getUnisexTshirtMockupPath(color.slug, 'back'),
    };
  }

  return images;
}
