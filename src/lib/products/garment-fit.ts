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

export function resolveDesignProduct(
  design: ProductDesignTemplate,
  fit?: GarmentFit,
): Product {
  if (design.productTypes.includes('t-shirt')) {
    const applicable = getDesignApplicableFits(design);
    const initialFit =
      fit && applicable.includes(fit) ? fit : applicable[0] ?? 'unisex';
    return resolveTshirtProductForDesign(design, initialFit);
  }

  const matched =
    products.find(
      (product) =>
        design.productTypes.includes(product.type) &&
        (!design.productIds || design.productIds.includes(product.id)),
    ) ?? products.find((item) => item.id === 'tshirt-basic-white');

  if (!matched) {
    throw new Error(`No product found for design ${design.id}`);
  }

  return matched;
}
