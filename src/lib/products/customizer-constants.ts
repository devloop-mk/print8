/**
 * Default uniform inset (%) when a product type has no custom print area.
 * Per-type chest/body zones: src/lib/products/print-area.ts
 * Per-type layout wiring: src/lib/products/product-mockup-layout.ts
 */
export const PRODUCT_PRINT_AREA_INSET_PERCENT = 12;

/** Max overlay width/height (% of mockup inner area) so art stays on the product. */
export const PRODUCT_PRINT_AREA_MAX_SCALE =
  100 - PRODUCT_PRINT_AREA_INSET_PERCENT * 2;

export const PRODUCT_PHOTO_MIN_SCALE = 15;

export const PRODUCT_PHOTO_CROP_ASPECT = 1;

export const PRODUCT_PHOTO_CROP_ASPECT_OPTIONS = [
  { id: 'square', ratio: 1, labelKey: 'cropAspectSquare' },
  { id: 'portrait', ratio: 3 / 4, labelKey: 'cropAspectPortrait' },
  { id: 'landscape', ratio: 4 / 3, labelKey: 'cropAspectLandscape' },
  { id: 'wide', ratio: 16 / 9, labelKey: 'cropAspectWide' },
] as const;
