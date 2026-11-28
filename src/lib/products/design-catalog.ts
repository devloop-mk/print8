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
import { productMatchesCatalogType } from '@/lib/products/drinkware-type-groups';
import { resolveDesignProduct as resolveDesignProductByFit, designResolvesToProduct, designSupportsGarmentFit, getProductGarmentFit } from '@/lib/products/garment-fit';
import {
  premadeDesignAppliesToProduct,
  productRequiresExplicitPremadeDesigns,
} from '@/lib/products/premade-design-product-match';
import { isProductIdHiddenFromStorefront } from '@/lib/products/storefront-hidden-types';
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
          !isProductIdHiddenFromStorefront(product.id) &&
          premadeDesignAppliesToProduct(design, product),
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

/**
 * Ready designs for one product SKU. Patch / polo blanks use explicit `productIds`
 * in code packs — those rows may be missing from DB-only catalog mode.
 */
export async function getProductPremadeDesignCatalogEntries(
  product: Product,
  category: ProductDesignCategory = 'image-designs',
): Promise<ProductDesignCatalogEntry[]> {
  const { getMergedProductDesignTemplates } = await import(
    '@/lib/products/merged-product-designs'
  );
  const merged = await getMergedProductDesignTemplates();
  const mergedById = new Map(merged.map((design) => [design.id, design]));

  const sourceTemplates = productRequiresExplicitPremadeDesigns(product)
    ? productDesignTemplates.filter(
        (design) =>
          design.category === category &&
          premadeDesignAppliesToProduct(design, product),
      )
    : merged.filter(
        (design) =>
          design.category === category &&
          premadeDesignAppliesToProduct(design, product),
      );

  return sourceTemplates.map((design) => ({
    design: mergedById.get(design.id) ?? design,
    products: [product],
  }));
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

/** Color chips for a single product page — capped to that SKU's palette. */
export function getCatalogColorsForProduct(
  product: Product,
  entries: ProductDesignCatalogEntry[],
): string[] {
  const designColors = new Set<string>();
  for (const entry of entries) {
    for (const color of getDesignApplicableColors(entry.design, product)) {
      designColors.add(normalizeHex(color));
    }
  }

  const productColors = product.colors ?? [];
  if (productColors.length > 0) {
    return productColors.filter((color) => {
      const hex = normalizeHex(color);
      if (designColors.size === 0) return true;
      return designColors.has(hex);
    });
  }

  return [...designColors];
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

export function filterDesignCatalogEntriesForProduct(
  entries: ProductDesignCatalogEntry[],
  product: Product,
): ProductDesignCatalogEntry[] {
  const fit = getProductGarmentFit(product);

  return entries
    .filter(({ design, products: matchedProducts }) => {
      if (!premadeDesignAppliesToProduct(design, product)) {
        return false;
      }
      if (!matchedProducts.some((item) => item.type === product.type)) {
        return false;
      }
      if (
        fit &&
        design.productTypes.includes('t-shirt') &&
        !designSupportsGarmentFit(design, fit)
      ) {
        return false;
      }
      return true;
    })
    .map(({ design, products: matchedProducts }) => ({
      design,
      products: matchedProducts.some((item) => item.id === product.id)
        ? matchedProducts.filter(
            (item) => item.id === product.id || item.type === product.type,
          )
        : productRequiresExplicitPremadeDesigns(product)
          ? [product]
          : [
              product,
              ...matchedProducts.filter((item) => item.type === product.type),
            ],
    }));
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
  if (filters.type !== 'all' && !productMatchesCatalogType(product, filters.type)) {
    return false;
  }
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
  preferredProductId?: string,
): { product: Product; color: string } {
  const requested =
    preferredProductId == null
      ? undefined
      : (entry.products.find((item) => item.id === preferredProductId) ??
        products.find((item) => item.id === preferredProductId));

  // Never preview a blank the design detail page will replace (kids tee for a
  // mug-only design, kids size for an adult-only design, and the same elsewhere).
  let product: Product | undefined;
  if (requested && designResolvesToProduct(entry.design, requested)) {
    product = requested;
  } else {
    const requestedType = requested?.type;
    const resolvedType =
      preferredType && entry.design.productTypes.includes(preferredType)
        ? preferredType
        : requestedType && entry.design.productTypes.includes(requestedType)
          ? requestedType
          : undefined;
    const requestedFit = requested
      ? (getProductGarmentFit(requested) ?? undefined)
      : undefined;
    product = resolveDesignProductByFit(
      entry.design,
      resolvedType === 't-shirt' ? requestedFit : undefined,
      resolvedType,
    );
  }
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
