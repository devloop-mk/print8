/**
 * Default uniform inset (%) when a product type has no custom print area.
 * Per-type chest/body zones: src/lib/products/print-area.ts
 * Per-type layout wiring: src/lib/products/product-mockup-layout.ts
 */
export const PRODUCT_PRINT_AREA_INSET_PERCENT = 12;

/** Max overlay width/height (% of mockup inner area) so art stays on the product. */
export const PRODUCT_PRINT_AREA_MAX_SCALE =
  100 - PRODUCT_PRINT_AREA_INSET_PERCENT * 2;

/**
 * Absolute floor for overlay width scale (% of mockup inner frame).
 * Shared by photo, design/template, and logo overlays so tall/narrow
 * artwork (e.g. stacked icon designs) can be shrunk enough to actually
 * fit inside narrow print areas instead of getting stuck oversized.
 * Was 15 — too high for very tall aspect ratios, see
 * getMaxScaleForPrintArea()/usePrintAreaMaxScale() which also floor to
 * this value and could force the *max* above the true aspect-correct
 * fit size, locking the resize handle at an overflowing size.
 */
export const PRODUCT_PHOTO_MIN_SCALE = 6;

/**
 * In the product customizer, users may scale photos/designs up to this
 * multiple of the print-area-fit max (1.5 = 50% past the fit width/height).
 */
export const PRODUCT_CUSTOMIZER_IMAGE_SCALE_OVERSHOOT = 1.5;

/** Hard ceiling for customizer image scale (% of mockup inner frame width). */
export const PRODUCT_CUSTOMIZER_IMAGE_ABSOLUTE_MAX_SCALE = 100;

/** Opacity for design pixels rendered outside the print area while editing. */
export const PRODUCT_CUSTOMIZER_OUTSIDE_PRINT_AREA_OPACITY = 0.15;

/** Default editor canvas zoom (%) when opening the product customizer. */
export const PRODUCT_CUSTOMIZER_DEFAULT_ZOOM = 115;

/**
 * Max scale users can pick in the customizer — print-area fit plus overshoot,
 * capped so art cannot span wider than the mockup frame.
 */
export function getCustomizerImageMaxScale(printAreaFitMax: number): number {
  const overshootMax = Math.floor(
    printAreaFitMax * PRODUCT_CUSTOMIZER_IMAGE_SCALE_OVERSHOOT,
  );
  return Math.min(
    PRODUCT_CUSTOMIZER_IMAGE_ABSOLUTE_MAX_SCALE,
    Math.max(PRODUCT_PHOTO_MIN_SCALE, overshootMax),
  );
}

export const PRODUCT_PHOTO_CROP_ASPECT = 1;

export const PRODUCT_PHOTO_CROP_ASPECT_OPTIONS = [
  { id: 'square', ratio: 1, labelKey: 'cropAspectSquare' },
  { id: 'portrait', ratio: 3 / 4, labelKey: 'cropAspectPortrait' },
  { id: 'landscape', ratio: 4 / 3, labelKey: 'cropAspectLandscape' },
  { id: 'wide', ratio: 16 / 9, labelKey: 'cropAspectWide' },
] as const;
