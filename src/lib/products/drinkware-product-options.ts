import {
  products,
  type Product,
  type ProductDesignTemplate,
  type ProductType,
} from '@/lib/data/catalog';
import { isCylindricalDrinkwareType } from '@/lib/products/product-mockup-layout';
import { getDrinkwareSublimationPatch } from '@/lib/products/drinkware-sublimation-patch';
import {
  DRINKWARE_GLASS_NAV_TYPE,
  isDrinkwareGlassType,
} from '@/lib/products/drinkware-type-groups';

export function isDrinkwareProduct(product: Product): boolean {
  return isCylindricalDrinkwareType(product.type);
}

/** Pre-printed interior message mugs — exterior only is customizable. */
export function isMugInsideProduct(productId: string): boolean {
  return productId.startsWith('mug-inside-');
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
  const glass = items.filter((product) => isDrinkwareGlassType(product.type));
  const thermos = items.filter((product) => product.type === 'thermos');
  const groups: DrinkwareProductGroup[] = [];

  if (glass.length > 0) {
    groups.push({ type: DRINKWARE_GLASS_NAV_TYPE, products: glass });
  }
  if (thermos.length > 0) {
    groups.push({ type: 'thermos', products: thermos });
  }

  return groups;
}

/**
 * Body-glaze swatches for the product sidebar.
 * Patch mugs use a fixed body colour; other SKUs expose their full palette even
 * when a loaded design only recommends one shirt/mug colour.
 */
export function getDrinkwareBodyColorOptions(product: Product): string[] {
  const productColors = product.colors ?? [];
  if (getDrinkwareSublimationPatch(product.id)) {
    return productColors;
  }
  return productColors;
}
