import type { CSSProperties } from 'react';
import type { Product, ProductType } from '@/lib/data/catalog';
import { PRODUCT_PRINT_AREA_MAX_SCALE } from '@/lib/products/customizer-constants';

export type ProductMockupLayout = {
  /** Customizer canvas mockup frame — size relative to parent (0–1) */
  customizerInnerScale: number;
  /** Catalog / design-card mockup zoom — 1 = natural fill, 1.35 = 35% larger */
  catalogScale: number;
  innerClass: string;
  catalogInnerClass: string;
  imageClass: string;
  catalogImageClass: string;
  printAreaClass: string;
  overlayMaxScale: number;
};

type MockupLayoutConfig = {
  customizerInnerScale?: number;
  catalogScale?: number;
  printAreaClass?: string;
  overlayMaxScale?: number;
};

function createMockupLayout({
  customizerInnerScale = 0.85,
  catalogScale = 1,
  printAreaClass = 'pointer-events-none absolute inset-[12%] rounded-xl border-2 border-dashed border-brand-300/40',
  overlayMaxScale = PRODUCT_PRINT_AREA_MAX_SCALE,
}: MockupLayoutConfig = {}): ProductMockupLayout {
  const customizerPct = Math.round(customizerInnerScale * 100);

  return {
    customizerInnerScale,
    catalogScale,
    innerClass: `relative h-[${customizerPct}%] w-[${customizerPct}%] select-none`,
    catalogInnerClass: 'relative h-full w-full select-none overflow-hidden',
    imageClass:
      'pointer-events-none h-full w-full origin-center object-contain',
    catalogImageClass:
      'pointer-events-none h-full w-full origin-center object-contain',
    printAreaClass,
    overlayMaxScale,
  };
}

const DEFAULT_MOCKUP_LAYOUT = createMockupLayout();

/** T-shirt mockups have side padding in the PNG — nudge catalog previews larger. */
const TSHIRT_MOCKUP_LAYOUT = createMockupLayout({
  catalogScale: 1.01,
});

/** Hoodie mockups have generous side padding — zoom in for design cards. */
const HOODIE_MOCKUP_LAYOUT = createMockupLayout({
  catalogScale: 1.27,
  customizerInnerScale: 0.88,
});

/** Bodysuit mockups include side padding in the PNG — zoom in and tighten the print zone. */
const BODYSUIT_MOCKUP_LAYOUT = createMockupLayout({
  customizerInnerScale: 1,
  catalogScale: 1.4,
  printAreaClass:
    'pointer-events-none absolute inset-[16%_22%_36%_22%] rounded-lg border-2 border-dashed border-brand-300/40',
  overlayMaxScale: 48,
});

const layoutsByType: Partial<Record<ProductType, ProductMockupLayout>> = {
  't-shirt': TSHIRT_MOCKUP_LAYOUT,
  hoodie: HOODIE_MOCKUP_LAYOUT,
  bodysuit: BODYSUIT_MOCKUP_LAYOUT,
};

/** Per-product catalog scale overrides — merge on top of the type defaults. */
const catalogScaleByProductId: Partial<Record<string, number>> = {
  // 'hoodie-basic-charcoal': 1.38,
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

  if (productCatalogScale === undefined) {
    return base;
  }

  return {
    ...base,
    catalogScale: productCatalogScale,
  };
}

export function getCatalogMockupImageStyle(
  layout: ProductMockupLayout,
): CSSProperties | undefined {
  if (layout.catalogScale === 1) return undefined;
  return { transform: `scale(${layout.catalogScale})` };
}

/** @deprecated Use getProductMockupLayout().innerClass */
export const PRODUCT_MOCKUP_INNER_CLASS = DEFAULT_MOCKUP_LAYOUT.innerClass;
