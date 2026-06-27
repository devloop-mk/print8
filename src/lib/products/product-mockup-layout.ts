import type { Product, ProductType } from '@/lib/data/catalog';
import { PRODUCT_PRINT_AREA_MAX_SCALE } from '@/lib/products/customizer-constants';

export type ProductMockupLayout = {
  /** Customizer canvas mockup frame */
  innerClass: string;
  /** Product grid / detail carousel — must fill the square preview area */
  catalogInnerClass: string;
  imageClass: string;
  /** className for next/image fill in catalog cards */
  catalogImageClass: string;
  printAreaClass: string;
  overlayMaxScale: number;
};

const DEFAULT_MOCKUP_LAYOUT: ProductMockupLayout = {
  innerClass: 'relative h-[85%] w-[85%] select-none',
  catalogInnerClass: 'relative h-full w-full select-none',
  imageClass: 'pointer-events-none h-full w-full object-contain',
  catalogImageClass: 'object-contain',
  printAreaClass:
    'pointer-events-none absolute inset-[12%] rounded-xl border-2 border-dashed border-brand-300/40',
  overlayMaxScale: PRODUCT_PRINT_AREA_MAX_SCALE,
};

/** Bodysuit mockups include side padding in the PNG — zoom in and tighten the print zone. */
const BODYSUIT_MOCKUP_LAYOUT: ProductMockupLayout = {
  innerClass: 'relative h-full w-full select-none overflow-hidden',
  catalogInnerClass: 'relative h-full w-full select-none overflow-hidden',
  imageClass:
    'pointer-events-none h-full w-full origin-center object-contain scale-[1.48]',
  catalogImageClass: 'origin-center object-contain scale-[1.48]',
  printAreaClass:
    'pointer-events-none absolute inset-[16%_22%_36%_22%] rounded-lg border-2 border-dashed border-brand-300/40',
  overlayMaxScale: 48,
};

const layoutsByType: Partial<Record<ProductType, ProductMockupLayout>> = {
  bodysuit: BODYSUIT_MOCKUP_LAYOUT,
};

export function getProductMockupLayout(
  productOrType: Product | ProductType,
): ProductMockupLayout {
  const type =
    typeof productOrType === 'string' ? productOrType : productOrType.type;
  return layoutsByType[type] ?? DEFAULT_MOCKUP_LAYOUT;
}

/** @deprecated Use getProductMockupLayout().innerClass */
export const PRODUCT_MOCKUP_INNER_CLASS = DEFAULT_MOCKUP_LAYOUT.innerClass;
