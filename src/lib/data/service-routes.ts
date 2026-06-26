import type { DesignCategory, ProductType, Service } from "@/lib/data/catalog";
import { productTypes, designCategories } from "@/lib/data/catalog";
import { productTypeHref } from "@/lib/products/product-nav";

function isProductType(value: string): value is ProductType {
  return (productTypes as readonly string[]).includes(value);
}

function isDesignCategory(value: string): value is DesignCategory {
  return (designCategories as readonly string[]).includes(value);
}

/** Canonical destination for a service — avoids duplicating product/design listings */
export function getServiceDestination(service: Service): string | null {
  if (service.customization === "products" && service.productTypes?.length) {
    const type = service.productTypes[0];
    if (isProductType(type)) {
      return productTypeHref(type);
    }
    return "/products";
  }

  if (service.customization === "designs" && service.designCategory) {
    return `/designs?category=${service.designCategory}`;
  }

  return null;
}

export function parseProductTypeFilter(
  value: string | null,
): ProductType | "all" {
  if (value && isProductType(value)) return value;
  return "all";
}

export function parseDesignCategoryFilter(
  value: string | null,
): DesignCategory | "all" {
  if (value && isDesignCategory(value)) return value;
  return "all";
}
