import {
  products,
  type Product,
  type ProductDesignTemplate,
  type ProductType,
} from '@/lib/data/catalog';
import { isCylindricalDrinkwareType } from '@/lib/products/product-mockup-layout';

export function isDrinkwareProduct(product: Product): boolean {
  return isCylindricalDrinkwareType(product.type);
}

/** Drinkware blanks compatible with the active design (type + optional productIds lock). */
export function getCompatibleDrinkwareProducts(
  design: ProductDesignTemplate | null | undefined,
): Product[] {
  return products.filter((product) => {
    if (!isDrinkwareProduct(product)) return false;
    if (!design) return true;
    if (!design.productTypes.includes(product.type)) return false;
    if (
      design.productIds?.length &&
      !design.productIds.includes(product.id)
    ) {
      return false;
    }
    return true;
  });
}

export type DrinkwareProductGroup = {
  type: ProductType;
  products: Product[];
};

/** Group compatible drinkware by product type for the selector UI. */
export function groupDrinkwareProducts(
  items: Product[],
): DrinkwareProductGroup[] {
  const order: ProductType[] = ['mug', 'cup', 'thermos'];
  return order
    .map((type) => ({
      type,
      products: items.filter((product) => product.type === type),
    }))
    .filter((group) => group.products.length > 0);
}
