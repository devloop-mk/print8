import type { ProductColorImages } from '@/lib/data/catalog';
import { normalizeHex } from '@/lib/products/design-overlay';

const LEGACY_PRODUCT_COLOR_ALIASES: Record<string, string> = {
  '#ffffff': '#c5ccd6',
  '#000000': '#1c1a1d',
  '#dc2626': '#db0213',
  '#1e40af': '#0f287c',
  '#1e293b': '#272d37',
  '#2563eb': '#0f287c',
};

export function resolveProductColorImageKey(color: string): string {
  const normalized = normalizeHex(color);
  return LEGACY_PRODUCT_COLOR_ALIASES[normalized] ?? normalized;
}

export function getProductColorImagesEntry(
  colorsImages: ProductColorImages | undefined,
  color: string,
) {
  if (!colorsImages) return undefined;

  const resolvedKey = resolveProductColorImageKey(color);
  return (
    colorsImages[resolvedKey] ??
    colorsImages[color] ??
    colorsImages[normalizeHex(color)]
  );
}
