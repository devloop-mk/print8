import type { Product, ProductDesignTemplate } from '@/lib/data/catalog';
import {
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  isRecolorableOverlayTemplate,
  isTextDesignTemplate,
} from '@/lib/data/catalog';
import {
  contrastRatio,
  isDarkShirtColor,
  normalizeHex,
} from '@/lib/products/design-overlay';

const MIN_TEXT_CONTRAST = 2.8;

function intersectWithProductColors(
  product: Product,
  colors: string[],
): string[] {
  const productColors = product.colors ?? [];
  if (productColors.length === 0) return [];

  const allowed = new Set(colors.map(normalizeHex));
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

  if (isOverlayDesignTemplate(design) && design.recommendedColor) {
    const wantsDarkShirt = isDarkShirtColor(design.recommendedColor);
    return productColors.filter((color) =>
      wantsDarkShirt ? isDarkShirtColor(color) : !isDarkShirtColor(color),
    );
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

  if (
    design.recommendedColor &&
    applicable.some(
      (color) =>
        normalizeHex(color) === normalizeHex(design.recommendedColor!),
    )
  ) {
    return design.recommendedColor;
  }

  return applicable[0];
}
