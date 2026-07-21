import {
  productDesignTemplates,
  products,
  type Product,
  type ProductDesignCategory,
  type ProductDesignTemplate,
  type ProductSide,
  type ProductType,
} from '@/lib/data/catalog';
import {
  getDesignApplicableColors,
} from '@/lib/products/design-applicable-colors';
import { normalizeHex } from '@/lib/products/design-overlay';
import { designMatchesSideFilter } from '@/lib/products/design-sides';
import {
  productBelongsToCategory,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import { resolveDesignProduct as resolveDesignProductByFit } from '@/lib/products/garment-fit';

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
      for (const color of getDesignApplicableColors(entry.design, product)) {
        colors.add(color);
      }
    }
  }
  return [...colors];
}

export type DesignCatalogFilters = {
  type: ProductType | 'all';
  color: string | 'all';
  /** @deprecated Side filter removed from catalog UI; kept optional for callers. */
  side?: ProductSide | 'all';
};

function designSupportsColor(
  design: ProductDesignTemplate,
  product: Product,
  color: string,
): boolean {
  return getDesignApplicableColors(design, product).some(
    (value) => normalizeHex(value) === normalizeHex(color),
  );
}

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
  const sideFilter = filters.side ?? 'all';
  return entries
    .filter(({ design, products: matchedProducts }) => {
      if (!designMatchesSideFilter(design, sideFilter)) {
        return false;
      }

      if (filters.color !== 'all') {
        const supportsColor = matchedProducts.some((product) =>
          designSupportsColor(design, product, filters.color),
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
  if (
    filters.color !== 'all' &&
    !product.colors?.some(
      (color) => normalizeHex(color) === normalizeHex(filters.color),
    )
  ) {
    return false;
  }
  return true;
}

export function resolveDesignProduct(
  entry: ProductDesignCatalogEntry,
  colorFilter: string | 'all',
  preferredType?: ProductType,
): { product: Product; color: string } {
  const resolvedType =
    preferredType && entry.design.productTypes.includes(preferredType)
      ? preferredType
      : entry.design.productTypes[0];
  const product =
    resolvedType === 't-shirt' &&
    entry.products.some((item) => item.type === 't-shirt')
      ? resolveDesignProductByFit(entry.design, undefined, resolvedType)
      : (entry.products.find((item) => item.type === resolvedType) ??
        entry.products[0]);
  const applicable = getDesignApplicableColors(entry.design, product);
  const defaultColor = applicable[0] ?? product.colors?.[0] ?? '#ffffff';
  const color =
    colorFilter !== 'all' &&
    applicable.some(
      (value) => normalizeHex(value) === normalizeHex(colorFilter),
    )
      ? colorFilter
      : defaultColor;

  return { product, color };
}
