import type { GarmentFit, Product, ProductDesignTemplate, ProductType } from '@/lib/data/catalog';
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
import { getProductGarmentFit, getDesignApplicableFits } from '@/lib/products/garment-fit';
import { resolveProductColorImageKey } from '@/lib/products/product-color-images';

const MIN_TEXT_CONTRAST = 2.8;

/** Shared whites across supplier palettes (unisex tee vs bodysuit mockups). */
const WHITE_SWATCH_EQUIVALENTS = new Set([
  '#ffffff',
  '#c5ccd6',
  '#fff',
]);

function paletteColorsMatch(productColor: string, savedColor: string): boolean {
  const productKey = normalizeHex(productColor);
  const savedKey = normalizeHex(savedColor);
  if (productKey === savedKey) return true;
  if (
    WHITE_SWATCH_EQUIVALENTS.has(productKey) &&
    WHITE_SWATCH_EQUIVALENTS.has(savedKey)
  ) {
    return true;
  }
  return false;
}

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

  return productColors.filter((color) =>
    [...allowed].some((saved) => paletteColorsMatch(color, saved)),
  );
}

/**
 * Stored admin palette for one t-shirt fit before product intersection.
 * `null` = use legacy `applicableColors`; `[]` = all colors for this fit.
 */
export function getDesignFitPalette(
  design: ProductDesignTemplate,
  garmentFit: GarmentFit,
): string[] | null {
  if (design.applicableColorsByFit?.[garmentFit] !== undefined) {
    return design.applicableColorsByFit[garmentFit] ?? [];
  }

  const hasAnyFitCustomization =
    design.applicableColorsByFit &&
    Object.keys(design.applicableColorsByFit).length > 0;
  const fits = getDesignApplicableFits(design);

  if (hasAnyFitCustomization || fits.length > 1) {
    return [];
  }

  return null;
}

/**
 * Stored admin palette for one non-tee product type before intersection.
 * `null` = use legacy `applicableColors`; `[]` = all colors for this type.
 */
export function getDesignProductTypePalette(
  design: ProductDesignTemplate,
  productType: ProductType,
): string[] | null {
  if (productType === 't-shirt') return null;

  if (design.applicableColorsByProductType?.[productType] !== undefined) {
    return design.applicableColorsByProductType[productType] ?? [];
  }

  const hasAnyTypeCustomization =
    design.applicableColorsByProductType &&
    Object.keys(design.applicableColorsByProductType).length > 0;

  if (hasAnyTypeCustomization || design.productTypes.length > 1) {
    return [];
  }

  return null;
}

/** Admin / storefront stored palette before product intersection. */
export function getDesignStoredApplicableColors(
  design: ProductDesignTemplate,
  productType?: ProductType | null,
  garmentFit?: GarmentFit | null,
): string[] | undefined {
  if (productType === 't-shirt' && garmentFit) {
    const palette = getDesignFitPalette(design, garmentFit);
    if (palette !== null) return palette;
    return design.applicableColors;
  }

  if (
    productType &&
    productType !== 't-shirt'
  ) {
    const palette = getDesignProductTypePalette(design, productType);
    if (palette !== null) return palette;
    return design.applicableColors;
  }

  return design.applicableColors;
}

export function getDesignApplicableColors(
  design: ProductDesignTemplate,
  product: Product,
): string[] {
  const productColors = product.colors ?? [];
  if (productColors.length === 0) return [];

  const garmentFit = getProductGarmentFit(product);
  const productType = product.type;

  if (productType !== 't-shirt') {
    const typePalette = getDesignProductTypePalette(design, productType);
    if (typePalette !== null) {
      if (typePalette.length > 0) {
        return intersectWithProductColors(product, typePalette);
      }
      // Explicit empty per-type list = all colors (fall through).
    } else if (design.applicableColors?.length) {
      return intersectWithProductColors(product, design.applicableColors);
    }
  }

  if (productType === 't-shirt' && garmentFit) {
    const fitPalette = getDesignFitPalette(design, garmentFit);
    if (fitPalette !== null) {
      if (fitPalette.length > 0) {
        return intersectWithProductColors(product, fitPalette);
      }
      // Explicit empty per-fit list = all colors (fall through).
    } else if (design.applicableColors?.length) {
      return intersectWithProductColors(product, design.applicableColors);
    }
  } else if (design.applicableColors?.length) {
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

function hashDesignId(designId: string): number {
  let hash = 0;
  for (let i = 0; i < designId.length; i += 1) {
    hash = (hash * 31 + designId.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Stable per-design pick from applicable shirt colors so catalog grids
 * don't all default to the same tee. Only varies when multiple colors are
 * applicable — never forces unsupported colors (including recommendedColor
 * outside the product palette).
 */
export function pickVariedDesignPreviewColor(
  design: ProductDesignTemplate,
  product: Product,
): string {
  const applicable = getDesignApplicableColors(design, product);
  if (applicable.length === 0) {
    return product.colors?.[0] ?? '#ffffff';
  }
  if (applicable.length === 1) {
    return applicable[0];
  }

  return applicable[hashDesignId(design.id) % applicable.length];
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
