import type { GarmentFit, Product, ProductDesignTemplate } from '@/lib/data/catalog';
import { products } from '@/lib/data/catalog';

export type { GarmentFit };

export const GARMENT_FIT_ORDER: GarmentFit[] = ['unisex', 'women', 'kids'];

const TSHIRT_PRODUCT_BY_FIT: Record<GarmentFit, string> = {
  unisex: 'tshirt-basic-white',
  women: 'tshirt-women-fitted',
  kids: 'tshirt-kids',
};

export function getTshirtProductIdForFit(fit: GarmentFit): string {
  return TSHIRT_PRODUCT_BY_FIT[fit];
}

export function getTshirtProductForFit(fit: GarmentFit): Product | undefined {
  return products.find((p) => p.id === TSHIRT_PRODUCT_BY_FIT[fit]);
}

export function getProductGarmentFit(product: Product): GarmentFit | null {
  if (product.type !== 't-shirt') return null;
  return product.fit ?? 'unisex';
}

export function isTshirtGarmentProduct(product: Product): boolean {
  return product.type === 't-shirt' && Boolean(product.fit);
}

export function getDesignApplicableFits(
  design: ProductDesignTemplate,
): GarmentFit[] {
  if (!design.productTypes.includes('t-shirt')) return [];

  if (design.applicableFits?.length) {
    return GARMENT_FIT_ORDER.filter((fit) =>
      design.applicableFits!.includes(fit),
    );
  }

  return ['unisex'];
}

export function designSupportsGarmentFit(
  design: ProductDesignTemplate,
  fit: GarmentFit,
): boolean {
  return getDesignApplicableFits(design).includes(fit);
}

export function resolveTshirtProductForDesign(
  design: ProductDesignTemplate,
  fit: GarmentFit,
): Product {
  const applicable = getDesignApplicableFits(design);
  const resolvedFit = applicable.includes(fit) ? fit : applicable[0] ?? 'unisex';

  const product = getTshirtProductForFit(resolvedFit);
  if (!product) {
    throw new Error(`No t-shirt product configured for fit ${resolvedFit}`);
  }

  return product;
}

/**
 * Primary catalog/PDP product type for a design — first entry in
 * `productTypes` (e.g. bodysuit before t-shirt for baby milestones).
 */
export function getDesignPrimaryProductType(
  design: ProductDesignTemplate,
): Product['type'] {
  return design.productTypes[0];
}

export function resolveDesignProductType(
  design: ProductDesignTemplate,
  preferredType?: Product['type'],
): Product['type'] {
  if (preferredType && design.productTypes.includes(preferredType)) {
    return preferredType;
  }
  return getDesignPrimaryProductType(design);
}

export function resolveDesignProduct(
  design: ProductDesignTemplate,
  fit?: GarmentFit,
  preferredType?: Product['type'],
): Product {
  const productType = resolveDesignProductType(design, preferredType);

  // T-shirt fit variants only when the resolved product is a tee.
  // Baby/bodysuit designs list bodysuit first — do not force a kids tee.
  if (productType === 't-shirt') {
    const applicable = getDesignApplicableFits(design);
    const initialFit =
      fit && applicable.includes(fit) ? fit : applicable[0] ?? 'unisex';
    return resolveTshirtProductForDesign(design, initialFit);
  }

  if (design.productIds?.length) {
    const primaryById = design.productIds
      .map((id) => products.find((product) => product.id === id))
      .find((product) => product?.type === productType);
    if (primaryById) return primaryById;

    // productIds may lock to a tee while productTypes still lists hoodie/etc.
    // Prefer a catalog product of the resolved type over the locked tee id.
    const typedCatalog = products.find(
      (product) =>
        product.type === productType &&
        design.productTypes.includes(product.type),
    );
    if (typedCatalog) return typedCatalog;

    const firstListed = design.productIds
      .map((id) => products.find((product) => product.id === id))
      .find((product): product is Product => Boolean(product));
    if (firstListed) return firstListed;
  }

  const matched =
    products.find(
      (product) =>
        product.type === productType &&
        (!design.productIds || design.productIds.includes(product.id)),
    ) ??
    products.find(
      (product) =>
        product.type === productType &&
        design.productTypes.includes(product.type),
    ) ??
    products.find(
      (product) =>
        design.productTypes.includes(product.type) &&
        (!design.productIds || design.productIds.includes(product.id)),
    ) ??
    products.find((item) => item.id === 'tshirt-basic-white');

  if (!matched) {
    throw new Error(`No product found for design ${design.id}`);
  }

  return matched;
}
