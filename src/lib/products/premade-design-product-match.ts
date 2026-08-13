import type { Product, ProductDesignTemplate } from '@/lib/data/catalog';
import { productIdsInclude } from '@/lib/products/product-id-aliases';
import { isPoloProduct } from '@/lib/products/polo-mockup-paths';

/** Products that only show premade designs explicitly linked via `productIds` in admin. */
export function productRequiresExplicitPremadeDesigns(product: Product): boolean {
  return isPoloProduct(product);
}

export function premadeDesignAppliesToProduct(
  design: ProductDesignTemplate,
  product: Product,
): boolean {
  if (!design.productTypes.includes(product.type)) return false;

  if (productRequiresExplicitPremadeDesigns(product)) {
    return productIdsInclude(design.productIds, product.id);
  }

  return !design.productIds?.length || productIdsInclude(design.productIds, product.id);
}
