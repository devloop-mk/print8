import { productTypes, type Product, type ProductType } from '@/lib/data/catalog';

/** Ceramic mugs + glass cups share one storefront category (Чаши). */
export const DRINKWARE_GLASS_TYPES = ['mug', 'cup'] as const;

/** Canonical route/filter key for the combined mug + cup group. */
export const DRINKWARE_GLASS_NAV_TYPE: ProductType = 'cup';

export function isDrinkwareGlassType(type: ProductType): boolean {
  return type === 'mug' || type === 'cup';
}

export function normalizeProductTypeRoute(type: ProductType): ProductType {
  return type === 'mug' ? DRINKWARE_GLASS_NAV_TYPE : type;
}

export function productMatchesCatalogType(
  product: Product,
  filterType: ProductType | 'all',
): boolean {
  if (filterType === 'all') return true;
  if (
    filterType === DRINKWARE_GLASS_NAV_TYPE &&
    isDrinkwareGlassType(product.type)
  ) {
    return true;
  }
  return product.type === filterType;
}

export function designPackMatchesCatalogType(
  packProductTypes: readonly ProductType[],
  filterType: ProductType | 'all',
): boolean {
  if (filterType === 'all') return true;
  if (filterType === DRINKWARE_GLASS_NAV_TYPE) {
    return packProductTypes.some(isDrinkwareGlassType);
  }
  return packProductTypes.includes(filterType);
}

export function catalogTypesAreSameGroup(a: ProductType, b: ProductType): boolean {
  if (isDrinkwareGlassType(a) && isDrinkwareGlassType(b)) return true;
  return a === b;
}

/** Product types listed in storefront nav and filter sidebars. */
export function getStorefrontProductTypes(): ProductType[] {
  return productTypes.filter((type) => type !== 'mug');
}

export function getNavProductTypes(types: ProductType[]): ProductType[] {
  return types.filter((type) => type !== 'mug');
}

export function getCategoryCatalogFilterTypes(types: ProductType[]): ProductType[] {
  return getNavProductTypes(types);
}
