import {
  getStorefrontBrowsableProducts,
} from '@/lib/cms/product-visibility';
import { getProductDisplayOrderRecord } from '@/lib/cms/display-order';
import type { Product, ProductType } from '@/lib/data/catalog';
import {
  productNavCategories,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import { sortByDisplayOrder } from '@/lib/products/sort-by-display-order';

export type HomeShowcaseCategory = {
  id: ProductNavCategoryId;
  products: Product[];
};

const PER_TYPE = 2;
const MAX_PER_CATEGORY = 4;

/** One–two products per type so the homepage shows breadth across categories. */
export async function getHomeShowcaseByCategory(): Promise<HomeShowcaseCategory[]> {
  const [orderMap, browsable] = await Promise.all([
    getProductDisplayOrderRecord(),
    getStorefrontBrowsableProducts(),
  ]);
  const sorted = sortByDisplayOrder(browsable, orderMap);

  return productNavCategories.map((category) => {
    const products: Product[] = [];

    for (const type of category.types) {
      const matches = sorted.filter((product) => product.type === type);
      for (const product of matches.slice(0, PER_TYPE)) {
        if (products.length >= MAX_PER_CATEGORY) break;
        if (!products.some((item) => item.id === product.id)) {
          products.push(product);
        }
      }
      if (products.length >= MAX_PER_CATEGORY) break;
    }

    return { id: category.id, products };
  });
}

export function getHomeShowcaseTypes(): ProductType[] {
  return productNavCategories.flatMap((category) => category.types);
}
