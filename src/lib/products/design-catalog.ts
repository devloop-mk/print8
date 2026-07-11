import {
  productDesignTemplates,
  products,
  type Product,
  type ProductDesignCategory,
  type ProductDesignTemplate,
  type ProductSide,
  type ProductType,
} from '@/lib/data/catalog';
import { getDesignApplicableColors } from '@/lib/products/design-applicable-colors';
import {
  productBelongsToCategory,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';

export type ProductDesignCatalogEntry = {
  design: ProductDesignTemplate;
  products: Product[];
};

export function buildProductDesignCatalogEntries(
  category: ProductDesignCategory,
  templates: ProductDesignTemplate[],
): ProductDesignCatalogEntry[] {
  return templates
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

export function getProductDesignCatalogEntries(
  category: ProductDesignCategory,
  templates?: ProductDesignTemplate[],
): ProductDesignCatalogEntry[] {
  const source = templates ?? productDesignTemplates;
  return buildProductDesignCatalogEntries(category, source);
}

export async function getMergedProductDesignCatalogEntries(
  category: ProductDesignCategory,
): Promise<ProductDesignCatalogEntry[]> {
  const { getMergedProductDesignTemplates } = await import(
    '@/lib/products/merged-product-designs'
  );
  const templates = await getMergedProductDesignTemplates();
  return buildProductDesignCatalogEntries(category, templates);
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

export function getProductDesignCatalogEntriesForType(
  type: ProductType,
  category: ProductDesignCategory = 'image-designs',
): ProductDesignCatalogEntry[] {
  return filterDesignCatalogEntries(getProductDesignCatalogEntries(category), {
    type,
    color: 'all',
    side: 'all',
  });
}

export function getCombinedProductDesignCatalogEntries(
  categoryId?: ProductNavCategoryId,
): ProductDesignCatalogEntry[] {
  const merged = [
    ...getProductDesignCatalogEntries('image-designs'),
    ...getProductDesignCatalogEntries('text-designs'),
  ];

  if (!categoryId) return merged;

  return merged
    .map((entry) => ({
      design: entry.design,
      products: entry.products.filter((product) =>
        productBelongsToCategory(product, categoryId),
      ),
    }))
    .filter((entry) => entry.products.length > 0);
}

export function filterDesignCatalogEntries(
  entries: ProductDesignCatalogEntry[],
  filters: DesignCatalogFilters,
): ProductDesignCatalogEntry[] {
  return entries
    .filter(({ design, products: matchedProducts }) => {
      if (filters.side !== 'all' && design.defaultSide !== filters.side) {
        return false;
      }

      if (filters.color !== 'all') {
        const supportsColor = matchedProducts.some((product) =>
          getDesignApplicableColors(design, product).includes(filters.color),
        );
        if (!supportsColor) return false;
      }

      return matchedProducts.some((product) =>
        matchesProductFilters(product, filters),
      );
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
