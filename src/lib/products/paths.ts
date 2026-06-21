export const PRODUCT_DESIGN_PREVIEW_LIMIT = 3;

export const PRODUCT_OFFERING_PATHS = {
  all: '/products',
  custom: '/products/custom',
  readyDesigns: '/products/ready-designs',
  textTemplates: '/products/text-templates',
} as const;

export function getProductPaths(productId: string, productType: string) {
  return {
    detail: `/products/${productId}`,
    custom: `/products/customize/${productType}?id=${productId}`,
    photoDesigns: `/products/${productId}/photo-designs`,
    textDesigns: `/products/${productId}/text-designs`,
  } as const;
}
