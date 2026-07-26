import type { CSSProperties } from 'react';
import type { Product, ProductType } from '@/lib/data/catalog';
import { PRODUCT_PRINT_AREA_INSET_PERCENT } from '@/lib/products/customizer-constants';
import {
  getUnisexTshirtCatalogScaleFromMockup,
  getUnisexTshirtCustomizerScaleFromMockup,
} from '@/lib/products/tshirt-unisex-colors';
import {
  getWomenTshirtCatalogScaleFromMockup,
  getWomenTshirtCustomizerScaleFromMockup,
} from '@/lib/products/tshirt-women-colors';
import {
  getKidsTshirtCatalogScaleFromMockup,
  getKidsTshirtCustomizerScaleFromMockup,
} from '@/lib/products/tshirt-kids-colors';
import {
  BAG_PRINT_AREA_INSETS,
  CAP_PRINT_AREA_INSETS,
  getPrintAreaMaxScale,
  getUniformPrintAreaInsets,
  HOODIE_PRINT_AREA_INSETS,
  TSHIRT_PRINT_AREA_INSETS,
  WOMEN_TSHIRT_PRINT_AREA_INSETS,
  BODYSUIT_PRINT_AREA_INSETS,
  type PrintAreaInsets,
  getDrinkwareUnwrapPrintInsets,
} from '@/lib/products/print-area';

export function isCylindricalDrinkwareType(type: ProductType): boolean {
  return type === 'mug' || type === 'cup' || type === 'thermos';
}

export type ProductMockupLayout = {
  /** Customizer canvas mockup frame — size relative to parent (0–1) */
  customizerInnerScale: number;
  /** Catalog / design-card mockup zoom — 1 = natural fill, 1.35 = 35% larger */
  catalogScale: number;
  innerClass: string;
  catalogInnerClass: string;
  imageClass: string;
  catalogImageClass: string;
  /** Front-face guide on the flat mockup preview (percent insets). */
  printArea: PrintAreaInsets;
  /** Optional full cylinder wrap bounds — used for overlay placement & max width. */
  wrapPrintArea?: PrintAreaInsets;
  overlayMaxScale: number;
};

type MockupLayoutConfig = {
  customizerInnerScale?: number;
  catalogScale?: number;
  printArea?: PrintAreaInsets;
  wrapPrintArea?: PrintAreaInsets;
  overlayMaxScale?: number;
};

function createMockupLayout({
  customizerInnerScale = 0.85,
  catalogScale = 1,
  printArea = getUniformPrintAreaInsets(PRODUCT_PRINT_AREA_INSET_PERCENT),
  wrapPrintArea,
  overlayMaxScale,
}: MockupLayoutConfig = {}): ProductMockupLayout {
  const customizerPct = Math.round(customizerInnerScale * 100);
  const placementArea = wrapPrintArea ?? printArea;
  const resolvedMaxScale =
    overlayMaxScale ?? getPrintAreaMaxScale(placementArea);

  return {
    customizerInnerScale,
    catalogScale,
    innerClass: `relative h-[${customizerPct}%] w-[${customizerPct}%] select-none`,
    catalogInnerClass: 'relative h-full w-full select-none overflow-hidden',
    imageClass:
      'pointer-events-none h-full w-full origin-center object-contain',
    catalogImageClass:
      'pointer-events-none h-full w-full origin-center object-contain',
    printArea,
    wrapPrintArea,
    overlayMaxScale: resolvedMaxScale,
  };
}

/** Bounds used for draggable overlays (wrap zone when cylindrical drinkware). */
export function getOverlayPrintBounds(
  layout: ProductMockupLayout,
): PrintAreaInsets {
  return layout.wrapPrintArea ?? layout.printArea;
}

const DEFAULT_MOCKUP_LAYOUT = createMockupLayout();

/** Fallback catalog scale when no per-color mockup path is available. */
const TSHIRT_MOCKUP_LAYOUT = createMockupLayout({
  customizerInnerScale: 1,
  catalogScale: 1.01,
  printArea: TSHIRT_PRINT_AREA_INSETS,
});

/** Hoodie mockups have generous side padding — zoom in for design cards. */
const HOODIE_MOCKUP_LAYOUT = createMockupLayout({
  catalogScale: 1.27,
  customizerInnerScale: 1,
  printArea: HOODIE_PRINT_AREA_INSETS,
});

/**
 * Hoodie photo mockups leave more empty canvas than unisex tees. Catalog/PDP
 * views zoom in via `catalogScale`; the interactive customizer stays at 1.
 */
export const HOODIE_MOCKUP_CATALOG_SCALE = 1.27;

/** Slight desktop-only zoom in the customizer — full garment stays visible. */
export const HOODIE_MOCKUP_CUSTOMIZER_SCALE_LG = 1.1;

/** Bodysuit mockups include side padding in the PNG — zoom in and tighten the print zone. */
const BODYSUIT_MOCKUP_LAYOUT = createMockupLayout({
  customizerInnerScale: 1,
  catalogScale: 1.4,
  printArea: BODYSUIT_PRINT_AREA_INSETS,
});

function createDrinkwareUnwrapLayout(type: 'mug' | 'cup' | 'thermos') {
  const unwrap = getDrinkwareUnwrapPrintInsets(type);
  return createMockupLayout({
    customizerInnerScale: 1,
    printArea: unwrap,
    wrapPrintArea: unwrap,
  });
}

const DRINKWARE_MOCKUP_LAYOUT = createDrinkwareUnwrapLayout('mug');
const CUP_MOCKUP_LAYOUT = createDrinkwareUnwrapLayout('cup');
const THERMOS_MOCKUP_LAYOUT = createDrinkwareUnwrapLayout('thermos');

const CAP_MOCKUP_LAYOUT = createMockupLayout({
  printArea: CAP_PRINT_AREA_INSETS,
});

const BAG_MOCKUP_LAYOUT = createMockupLayout({
  printArea: BAG_PRINT_AREA_INSETS,
});

const layoutsByType: Partial<Record<ProductType, ProductMockupLayout>> = {
  't-shirt': TSHIRT_MOCKUP_LAYOUT,
  hoodie: HOODIE_MOCKUP_LAYOUT,
  bodysuit: BODYSUIT_MOCKUP_LAYOUT,
  mug: DRINKWARE_MOCKUP_LAYOUT,
  cup: CUP_MOCKUP_LAYOUT,
  thermos: THERMOS_MOCKUP_LAYOUT,
  cap: CAP_MOCKUP_LAYOUT,
  bag: BAG_MOCKUP_LAYOUT,
};

/** Per-product print-area overrides — merge on top of the type defaults. */
const printAreaByProductId: Partial<Record<string, PrintAreaInsets>> = {
  /** Fitted women's tee — narrower chest zone for the tapered silhouette. */
  'tshirt-women-fitted': WOMEN_TSHIRT_PRINT_AREA_INSETS,
};

export type MockupDisplayVariant = 'catalog-card' | 'catalog-design' | 'customizer';

/**
 * Per-color drinkware mockup zoom. White ceramic on a white page under-reads vs
 * colored glaze even when asset fill % matches.
 * Keys match catalog `colorsImages` basename (no extension).
 * Prefer fixing the asset (`mug-white-classic-v2.jpg`); keep this as a light
 * optical correction only — do not stack a large CSS zoom on top of a large reframe.
 */
const DRINKWARE_MOCKUP_CATALOG_SCALE: Record<string, number> = {
  'mug-white-classic-v2': 1.03,
  'mug-white-classic': 1.03,
};

const DRINKWARE_MOCKUP_CUSTOMIZER_SCALE: Record<string, number> = {
  'mug-white-classic-v2': 1.02,
  'mug-white-classic': 1.02,
};

function getDrinkwareMockupScaleFromPath(
  mockupPath: string,
  variant: MockupDisplayVariant,
): number | undefined {
  const file = mockupPath.split('/').pop()?.replace(/\.[^.]+$/, '') ?? '';
  if (!file) return undefined;
  if (variant === 'customizer') {
    return DRINKWARE_MOCKUP_CUSTOMIZER_SCALE[file];
  }
  return DRINKWARE_MOCKUP_CATALOG_SCALE[file];
}

function getPerColorTshirtMockupScale(
  product: Product,
  mockupPath: string,
  variant: MockupDisplayVariant,
): number {
  if (product.fit === 'women') {
    if (variant === 'customizer') {
      return getWomenTshirtCustomizerScaleFromMockup(mockupPath);
    }
    return getWomenTshirtCatalogScaleFromMockup(mockupPath);
  }

  if (product.fit === 'kids') {
    if (variant === 'customizer') {
      return getKidsTshirtCustomizerScaleFromMockup(mockupPath);
    }
    return getKidsTshirtCatalogScaleFromMockup(mockupPath);
  }

  if (variant === 'customizer') {
    return getUnisexTshirtCustomizerScaleFromMockup(mockupPath);
  }

  return getUnisexTshirtCatalogScaleFromMockup(mockupPath);
}

/**
 * Single source of truth for mockup zoom across storefront, customizer,
 * and admin previews. Per-color photo mockup scale compensates for extra canvas
 * padding so overlays stay proportional to the product.
 */
export type MockupDisplayOptions = {
  /** Desktop customizer — hoodie mockup can zoom slightly without clipping. */
  largeCustomizerViewport?: boolean;
};

export function resolveMockupDisplayScale(
  product: Product,
  mockupPath?: string,
  variant: MockupDisplayVariant = 'catalog-design',
  options?: MockupDisplayOptions,
): number {
  const layout = getProductMockupLayout(product);

  if (product.type === 't-shirt' && mockupPath) {
    return getPerColorTshirtMockupScale(product, mockupPath, variant);
  }

  if (isCylindricalDrinkwareType(product.type) && mockupPath) {
    const drinkwareScale = getDrinkwareMockupScaleFromPath(mockupPath, variant);
    if (drinkwareScale !== undefined) {
      return drinkwareScale;
    }
  }

  if (product.type === 'hoodie') {
    // Customizer must show the full garment (hood + hem). Catalog/PDP zoom in.
    if (variant === 'customizer') {
      return options?.largeCustomizerViewport
        ? HOODIE_MOCKUP_CUSTOMIZER_SCALE_LG
        : 1;
    }
    return layout.catalogScale;
  }

  // `catalogScale` compensates for padding baked into catalog/design-card
  // mockup thumbnails (see per-type layout comments below). The interactive
  // customizer must show the *full* garment so the user can place designs
  // near any edge — applying the same zoom there clips the neckline/hem
  // (e.g. bodysuit) once the scaled image overflows its clipped frame.
  if (variant === 'customizer') {
    return 1;
  }

  return layout.catalogScale;
}

/**
 * Zoom for photo mockups with extra canvas padding.
 * Apply to a wrapper that contains the shirt image AND any overlays / print-area
 * guides so they stay aligned. For shirt-only catalog thumbnails, the img itself
 * may use this style instead.
 */
export function getMockupImageDisplayStyle(
  product: Product,
  mockupPath?: string,
  variant: MockupDisplayVariant = 'catalog-design',
  options?: MockupDisplayOptions,
): CSSProperties | undefined {
  const scale = resolveMockupDisplayScale(product, mockupPath, variant, options);
  if (scale === 1) return undefined;
  return { transform: `scale(${scale})`, transformOrigin: 'center center' };
}

export function getProductMockupLayout(
  productOrType: Product | ProductType,
): ProductMockupLayout {
  const product = typeof productOrType === 'string' ? null : productOrType;
  const type =
    typeof productOrType === 'string' ? productOrType : productOrType.type;

  if (product && isCylindricalDrinkwareType(product.type)) {
    const unwrap = getDrinkwareUnwrapPrintInsets(product.type, product.id);
    return createMockupLayout({
      customizerInnerScale: 1,
      printArea: unwrap,
      wrapPrintArea: unwrap,
    });
  }

  const base = layoutsByType[type] ?? DEFAULT_MOCKUP_LAYOUT;

  const productPrintArea =
    product?.id && printAreaByProductId[product.id] !== undefined
      ? printAreaByProductId[product.id]
      : undefined;

  if (productPrintArea === undefined) {
    return base;
  }

  const placementArea = base.wrapPrintArea ?? productPrintArea;

  return {
    ...base,
    printArea: productPrintArea,
    overlayMaxScale: getPrintAreaMaxScale(placementArea),
  };
}

export function getCatalogMockupImageStyle(
  layout: ProductMockupLayout,
): import('react').CSSProperties | undefined {
  if (layout.catalogScale === 1) return undefined;
  return { transform: `scale(${layout.catalogScale})` };
}

/** @deprecated Use getProductMockupLayout().innerClass */
export const PRODUCT_MOCKUP_INNER_CLASS = DEFAULT_MOCKUP_LAYOUT.innerClass;
