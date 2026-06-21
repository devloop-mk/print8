import {
  productDesignTemplates,
  products,
  type Product,
  type ProductDesignCategory,
  type ProductDesignTemplate,
  type ProductSide,
  type ProductType,
} from '@/lib/data/catalog';

export type ProductDesignCatalogEntry = {
  design: ProductDesignTemplate;
  products: Product[];
};

export function getProductDesignCatalogEntries(
  category: ProductDesignCategory,
): ProductDesignCatalogEntry[] {
  return productDesignTemplates
    .filter((design) => design.category === category)
    .map((design) => ({
      design,
      products: products.filter(
        (product) =>
          design.productTypes.includes(product.type) &&
          (!design.productIds || design.productIds.includes(product.id)),
      ),
    }))
    .filter((entry) => entry.products.length > 0);
}

export function getCatalogColors(entries: ProductDesignCatalogEntry[]): string[] {
  const colors = new Set<string>();
  for (const entry of entries) {
    for (const product of entry.products) {
      product.colors?.forEach((color) => colors.add(color));
    }
  }
  return [...colors];
}

export type DesignCatalogFilters = {
  type: ProductType | 'all';
  color: string | 'all';
  side: ProductSide | 'all';
};

export function filterDesignCatalogEntries(
  entries: ProductDesignCatalogEntry[],
  filters: DesignCatalogFilters,
): ProductDesignCatalogEntry[] {
  return entries
    .filter(({ design, products: matchedProducts }) => {
      if (filters.side !== 'all' && design.defaultSide !== filters.side) {
        return false;
      }

      return matchedProducts.some((product) => matchesProductFilters(product, filters));
    })
    .map(({ design, products: matchedProducts }) => ({
      design,
      products: matchedProducts.filter((product) =>
        matchesProductFilters(product, filters),
      ),
    }));
}

function matchesProductFilters(
  product: Product,
  filters: DesignCatalogFilters,
): boolean {
  if (filters.type !== 'all' && product.type !== filters.type) return false;
  if (filters.color !== 'all' && !product.colors?.includes(filters.color)) {
    return false;
  }
  return true;
}

export function resolveDesignProduct(
  entry: ProductDesignCatalogEntry,
  colorFilter: string | 'all',
): { product: Product; color: string } {
  const product = entry.products[0];
  const defaultColor = product.colors?.[0] ?? '#ffffff';
  const color =
    colorFilter !== 'all' && product.colors?.includes(colorFilter)
      ? colorFilter
      : defaultColor;

  return { product, color };
}
