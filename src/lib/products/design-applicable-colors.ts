import type { Product, ProductDesignTemplate } from '@/lib/data/catalog';
import {
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  isRecolorableOverlayTemplate,
  isTextDesignTemplate,
} from '@/lib/data/catalog';
import {
  contrastRatio,
  normalizeHex,
} from '@/lib/products/design-overlay';
import { resolveProductColorImageKey } from '@/lib/products/product-color-images';

const MIN_TEXT_CONTRAST = 2.8;

function intersectWithProductColors(
  product: Product,
  colors: string[],
): string[] {
  const productColors = product.colors ?? [];
  if (productColors.length === 0) return [];

  const allowed = new Set(colors.map(normalizeHex));
  // Map legacy shirt hex values saved in admin to the current supplier palette.
  const legacyMap: Record<string, string> = {
    '#ffffff': '#c5ccd6',
    '#000000': '#1c1a1d',
    '#dc2626': '#db0213',
    '#1e40af': '#0f287c',
    '#1e293b': '#272d37',
    '#2563eb': '#0f287c',
  };
  for (const color of colors) {
    const mapped = legacyMap[normalizeHex(color)];
    if (mapped) allowed.add(normalizeHex(mapped));
  }

  return productColors.filter((color) => allowed.has(normalizeHex(color)));
}

export function getDesignApplicableColors(
  design: ProductDesignTemplate,
  product: Product,
): string[] {
  const productColors = product.colors ?? [];
  if (productColors.length === 0) return [];

  if (design.applicableColors?.length) {
    return intersectWithProductColors(product, design.applicableColors);
  }

  if (design.overlayColorVariants) {
    const variantKeys = new Set(
      Object.keys(design.overlayColorVariants).map(normalizeHex),
    );
    return productColors.filter((color) =>
      variantKeys.has(normalizeHex(color)),
    );
  }

  if (
    isOverlayDesignTemplate(design) &&
    isRecolorableOverlayTemplate(design)
  ) {
    return productColors;
  }

  // recommendedColor only sets the default preview — admin applicableColors
  // controls which swatches are shown. Without explicit admin colors, show all.
  if (isOverlayDesignTemplate(design)) {
    return productColors;
  }

  if (isTextDesignTemplate(design) && design.textStyle) {
    const textColor = design.textStyle.textColor;
    return productColors.filter(
      (color) => contrastRatio(textColor, color) >= MIN_TEXT_CONTRAST,
    );
  }

  if (isImageDesignTemplate(design)) {
    return productColors;
  }

  return productColors;
}

export function resolveDesignPreviewColor(
  design: ProductDesignTemplate,
  product: Product,
  selectedColor?: string,
): string {
  const applicable = getDesignApplicableColors(design, product);
  if (applicable.length === 0) {
    return product.colors?.[0] ?? '#ffffff';
  }

  if (
    selectedColor &&
    applicable.some(
      (color) => normalizeHex(color) === normalizeHex(selectedColor),
    )
  ) {
    return selectedColor;
  }

  if (design.recommendedColor) {
    const recommendedKey = resolveProductColorImageKey(design.recommendedColor);
    const recommended = applicable.find(
      (color) => normalizeHex(color) === normalizeHex(recommendedKey),
    );
    if (recommended) return recommended;
  }

  return applicable[0];
}
