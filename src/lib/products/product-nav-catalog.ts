import {
  isBrowsableProduct,
  products,
  productTypes,
  type Product,
  type ProductType,
} from '@/lib/data/catalog';
import {
  getCategoryForProductType,
  getProductNavCategory,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';

export function getProductsForCategory(categoryId: ProductNavCategoryId) {
  const category = getProductNavCategory(categoryId);
  return products.filter(
    (product) =>
      category.types.includes(product.type) && isBrowsableProduct(product),
  );
}

/** Sample products from other types for cross-sell on type pages. */
export function getSuggestedProductsForType(
  currentType: ProductType,
  limit = 8,
): Product[] {
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
    const matches = products.filter(
      (product) => product.type === type && isBrowsableProduct(product),
    );
    for (const product of matches.slice(0, 2)) {
      if (result.length >= limit) return result;
      result.push(product);
    }
  }
  return result;
}
