export const PRODUCT_DESIGN_PREVIEW_LIMIT = 3;

export const PRODUCT_OFFERING_PATHS = {
  all: '/products',
  custom: '/products/custom',
  brandingPack: '/products/branding-pack',
  readyDesigns: '/products/ready-designs',
  kidsReadyDesigns: '/products/ready-designs/kids',
  couplesReadyDesigns: '/products/ready-designs/couples',
  textTemplates: '/products/text-templates',
  category: (categoryId: string) => `/products/category/${categoryId}`,
  categoryBrowse: (categoryId: string) => `/products/category/${categoryId}/browse`,
  type: (type: string) => `/products/type/${type}`,
} as const;

/** Kids animal / character tees (not birthday-themed). */
export const KIDS_GENERATED_COLLECTION = 'kids';

/** Birthday-themed kids & family matching tees. */
export const KIDS_BIRTHDAY_COLLECTION = 'kids-birthday';

/** @deprecated Use {@link KIDS_BIRTHDAY_COLLECTION} — kept for legacy URLs. */
export const KIDS_DESIGN_COLLECTION = KIDS_BIRTHDAY_COLLECTION;

export const KIDS_DESIGN_COLLECTIONS = [
  KIDS_GENERATED_COLLECTION,
  KIDS_BIRTHDAY_COLLECTION,
] as const;

/** Collection id used by matching couple-pack designs. */
export const COUPLES_DESIGN_COLLECTION = 'couple-packs';

export type CustomizerUrlOptions = {
  design?: string;
  edit?: string;
  color?: string;
  size?: string;
  fit?: string;
  /**
   * Set when the link should explicitly resume a previously saved draft
   * (e.g. the pencil icon in the "ongoing designs" list). When omitted,
   * the customizer starts a fresh session instead of silently restoring
   * whatever was last saved for this product/design combination.
   */
  resume?: boolean;
  /**
   * Internal path (+ search) to return to when leaving the customizer
   * (e.g. filtered designs catalog). Must start with `/`.
   */
  returnTo?: string;
};

/** Allow only same-site relative paths for return navigation. */
export function sanitizeReturnTo(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  let decoded = value.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    return null;
  }
  if (!decoded.startsWith('/')) return null;
  if (decoded.startsWith('//') || decoded.includes('://')) return null;
  if (decoded.includes('\\')) return null;
  return decoded;
}

export function buildCustomizerUrl(
  productId: string,
  productType: string,
  options?: CustomizerUrlOptions,
) {
  const params = new URLSearchParams({ id: productId });
  if (options?.design) params.set('design', options.design);
  if (options?.edit) params.set('edit', options.edit);
  if (options?.color) params.set('color', options.color);
  if (options?.size) params.set('size', options.size);
  if (options?.fit && productType === 't-shirt') {
    params.set('fit', options.fit);
  }
  if (options?.resume) params.set('resume', '1');
  const returnTo = sanitizeReturnTo(options?.returnTo);
  if (returnTo) params.set('returnTo', returnTo);
  return `/products/customize/${productType}?${params.toString()}`;
}

export function buildDesignDetailUrl(
  designId: string,
  options?: { type?: string; returnTo?: string },
) {
  const params = new URLSearchParams();
  if (options?.type) params.set('type', options.type);
  const returnTo = sanitizeReturnTo(options?.returnTo);
  if (returnTo) params.set('returnTo', returnTo);
  const queryString = params.toString();
  return queryString
    ? `/products/design/${designId}?${queryString}`
    : `/products/design/${designId}`;
}

export function buildCouplePackDetailUrl(packId: string) {
  return `/products/design/couple/${packId}`;
}

export function getProductPaths(
  productId: string,
  productType: string,
  options?: Pick<CustomizerUrlOptions, 'color' | 'size'>,
) {
  return {
    detail: `/products/${productId}`,
    custom: buildCustomizerUrl(productId, productType, options),
    photoDesigns: `/products/${productId}/photo-designs`,
    textDesigns: `/products/${productId}/text-designs`,
    premadeDesigns: `/products/${productId}/designs`,
  } as const;
}
