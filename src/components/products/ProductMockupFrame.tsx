import type { ReactNode } from "react";
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
}: {
  children: ReactNode;
  className?: string;
  layout?: ProductMockupLayout;
  productType?: ProductType;
  /** `catalog` fills the card preview; `customizer` uses the smaller in-canvas frame */
  variant?: "customizer" | "catalog";
}) {
  const resolvedLayout =
    layout ?? (productType ? getProductMockupLayout(productType) : getProductMockupLayout("t-shirt"));

  const innerClass =
    variant === "catalog"
      ? resolvedLayout.catalogInnerClass
      : resolvedLayout.innerClass;

  return (
    <div
      className={`relative flex aspect-square w-full items-center justify-center rounded-2xl border border-ink-100 bg-white ${className}`}
    >
      <div className={innerClass}>{children}</div>
    </div>
  );
}

export function getMockupImageClass(product: Product): string {
  return getProductMockupLayout(product).imageClass;
}
