export const PRODUCT_DESIGN_PREVIEW_LIMIT = 3;

export const PRODUCT_OFFERING_PATHS = {
  all: '/products',
  custom: '/products/custom',
  readyDesigns: '/products/ready-designs',
  textTemplates: '/products/text-templates',
} as const;

export type CustomizerUrlOptions = {
  design?: string;
  edit?: string;
  color?: string;
  size?: string;
};

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
  return `/products/customize/${productType}?${params.toString()}`;
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
  } as const;
}
