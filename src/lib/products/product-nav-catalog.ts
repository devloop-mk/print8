import {
  isBrowsableProduct,
  products,
  productTypes,
  type Product,
  type ProductType,
} from '@/lib/data/catalog';
import {
  filterProductsByStorefrontVisibility,
  getProductVisibilityRecord,
} from '@/lib/cms/product-visibility';
import {
  getCategoryForProductType,
  getProductNavCategory,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';

export async function getProductsForCategory(categoryId: ProductNavCategoryId) {
  const category = getProductNavCategory(categoryId);
  const visibility = await getProductVisibilityRecord();
  return filterProductsByStorefrontVisibility(
    products.filter(
      (product) =>
        category.types.includes(product.type) && isBrowsableProduct(product),
    ),
    visibility,
  );
}

/** Sync helper when visibility is already loaded. */
export function getProductsForCategoryWithVisibility(
  categoryId: ProductNavCategoryId,
  visibility: Record<string, boolean>,
) {
  const category = getProductNavCategory(categoryId);
  return filterProductsByStorefrontVisibility(
    products.filter(
      (product) =>
        category.types.includes(product.type) && isBrowsableProduct(product),
    ),
    visibility,
  );
}

/** Sample products from other types for cross-sell on type pages. */
export async function getSuggestedProductsForType(
  currentType: ProductType,
  limit = 8,
): Promise<Product[]> {
  const visibility = await getProductVisibilityRecord();
  const parentCategory = getCategoryForProductType(currentType);
  const siblingTypes = (parentCategory?.types ?? []).filter(
    (type) => type !== currentType,
  );
  const otherTypes = productTypes.filter((type) => type !== currentType);
  const orderedTypes = [
    ...siblingTypes,
    ...otherTypes.filter((type) => !siblingTypes.includes(type)),
  ];

  const result: Product[] = [];
  for (const type of orderedTypes) {
    const matches = filterProductsByStorefrontVisibility(
      products.filter(
        (product) => product.type === type && isBrowsableProduct(product),
      ),
      visibility,
    );
    for (const product of matches.slice(0, 2)) {
      if (result.length >= limit) return result;
      result.push(product);
    }
  }
  return result;
}
