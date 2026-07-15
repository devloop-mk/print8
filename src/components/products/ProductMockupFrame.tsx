import type { CSSProperties, ReactNode } from "react";
import {
  getProductMockupLayout,
  type ProductMockupLayout,
} from "@/lib/products/product-mockup-layout";
import type { Product, ProductType } from "@/lib/data/catalog";

export {
  getProductMockupLayout,
  PRODUCT_MOCKUP_INNER_CLASS,
} from "@/lib/products/product-mockup-layout";

export function ProductMockupFrame({
  children,
  className = "",
  layout,
  productType,
  variant = "customizer",
  innerStyle,
}: {
  children: ReactNode;
  className?: string;
  layout?: ProductMockupLayout;
  productType?: ProductType;
  /** `catalog` fills the card preview; `customizer` uses the smaller in-canvas frame */
  variant?: "customizer" | "catalog";
  /** Scale wrapper — keeps shirt, overlays, and print-area guides aligned */
  innerStyle?: CSSProperties;
}) {
  const resolvedLayout =
    layout ?? (productType ? getProductMockupLayout(productType) : getProductMockupLayout("t-shirt"));

  const innerClass =
    variant === "catalog"
      ? resolvedLayout.catalogInnerClass
      : resolvedLayout.innerClass;

  return (
    <div
      data-mockup-frame
      className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-ink-100 bg-white ${className}`}
    >
      <div className={innerClass}>
        <div className="relative h-full w-full" style={innerStyle}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function getMockupImageClass(product: Product): string {
  return getProductMockupLayout(product).imageClass;
}
