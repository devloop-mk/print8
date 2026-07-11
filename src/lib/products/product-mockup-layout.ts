import type { Product, ProductType } from '@/lib/data/catalog';
import { PRODUCT_PRINT_AREA_INSET_PERCENT } from '@/lib/products/customizer-constants';
import {
  BAG_PRINT_AREA_INSETS,
  CAP_PRINT_AREA_INSETS,
  DRINKWARE_PRINT_AREA_INSETS,
  DRINKWARE_WRAP_PRINT_AREA_INSETS,
  getPrintAreaMaxScale,
  getUniformPrintAreaInsets,
  HOODIE_PRINT_AREA_INSETS,
  TSHIRT_PRINT_AREA_INSETS,
  BODYSUIT_PRINT_AREA_INSETS,
  THERMOS_PRINT_AREA_INSETS,
  THERMOS_WRAP_PRINT_AREA_INSETS,
  type PrintAreaInsets,
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

/** T-shirt mockups have side padding in the PNG — nudge catalog previews larger. */
const TSHIRT_MOCKUP_LAYOUT = createMockupLayout({
  catalogScale: 1.01,
  printArea: TSHIRT_PRINT_AREA_INSETS,
});

/** Hoodie mockups have generous side padding — zoom in for design cards. */
const HOODIE_MOCKUP_LAYOUT = createMockupLayout({
  catalogScale: 1.27,
  customizerInnerScale: 0.88,
  printArea: HOODIE_PRINT_AREA_INSETS,
});

/** Bodysuit mockups include side padding in the PNG — zoom in and tighten the print zone. */
const BODYSUIT_MOCKUP_LAYOUT = createMockupLayout({
  customizerInnerScale: 1,
  catalogScale: 1.4,
  printArea: BODYSUIT_PRINT_AREA_INSETS,
});

const DRINKWARE_MOCKUP_LAYOUT = createMockupLayout({
  printArea: DRINKWARE_PRINT_AREA_INSETS,
  wrapPrintArea: DRINKWARE_WRAP_PRINT_AREA_INSETS,
});

const THERMOS_MOCKUP_LAYOUT = createMockupLayout({
  customizerInnerScale: 0.82,
  printArea: THERMOS_PRINT_AREA_INSETS,
  wrapPrintArea: THERMOS_WRAP_PRINT_AREA_INSETS,
});

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
  cup: DRINKWARE_MOCKUP_LAYOUT,
  thermos: THERMOS_MOCKUP_LAYOUT,
  cap: CAP_MOCKUP_LAYOUT,
  bag: BAG_MOCKUP_LAYOUT,
};

/** Per-product catalog scale overrides — merge on top of the type defaults. */
const catalogScaleByProductId: Partial<Record<string, number>> = {
  // 'hoodie-basic-charcoal': 1.38,
};

/** Per-product print-area overrides — merge on top of the type defaults. */
const printAreaByProductId: Partial<Record<string, PrintAreaInsets>> = {
  // 'tshirt-basic-white': { top: 26, right: 18, bottom: 52, left: 18 },
};

export function getProductMockupLayout(
  productOrType: Product | ProductType,
): ProductMockupLayout {
  const product = typeof productOrType === 'string' ? null : productOrType;
  const type =
    typeof productOrType === 'string' ? productOrType : productOrType.type;
  const base = layoutsByType[type] ?? DEFAULT_MOCKUP_LAYOUT;

  const productCatalogScale =
    product?.id && catalogScaleByProductId[product.id] !== undefined
      ? catalogScaleByProductId[product.id]
      : undefined;

  const productPrintArea =
    product?.id && printAreaByProductId[product.id] !== undefined
      ? printAreaByProductId[product.id]
      : undefined;

  if (productCatalogScale === undefined && productPrintArea === undefined) {
    return base;
  }

  const printArea = productPrintArea ?? base.printArea;
  const placementArea = base.wrapPrintArea ?? printArea;

  return {
    ...base,
    catalogScale: productCatalogScale ?? base.catalogScale,
    printArea,
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
