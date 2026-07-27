/**
 * Printable region on the product mockup (percent of the mockup inner frame).
 *
 * Fine-tune per product type:
 *   • Drinkware flat unwrap (dashed 2D border) — constants below + getDrinkwareUnwrapPrintInsets()
 *   • Photo mockups (tee, hoodie, …) — product-mockup-layout.ts layoutsByType
 *
 * Global defaults:
 *   customizer-constants.ts → PRODUCT_PRINT_AREA_INSET_PERCENT
 */

import type { ProductType } from '@/lib/data/catalog';

export type PrintAreaInsets = {
  /** Distance from top edge (%) */
  top: number;
  /** Distance from right edge (%) */
  right: number;
  /** Distance from bottom edge (%) */
  bottom: number;
  /** Distance from left edge (%) */
  left: number;
};

export const DEFAULT_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 12,
  right: 12,
  bottom: 12,
  left: 12,
};

/** Chest print zone for t-shirts (front). */
export const TSHIRT_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 22,
  right: 32,
  bottom: 13,
  left: 32,
};

/**
 * Fitted women's tee — narrower + shorter chest zone so the guide sits on
 * fabric through the tapered waist (not sleeve/armhole).
 */
export const WOMEN_TSHIRT_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 23,
  right: 27,
  bottom: 15,
  left: 27,
};

export const WOMEN_TSHIRT_SMALL_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 28,
  right: 38,
  bottom: 40,
  left: 38,
};

/** Chest print zone for hoodies. */
export const HOODIE_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 30,
  right: 24,
  bottom: 10,
  left: 24,
};

/** Bodysuit front print zone. */
export const BODYSUIT_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 17,
  right: 31,
  bottom: 20,
  left: 31,
};

/**
 * Drinkware — flat cylinder unwrap editor (dashed border on the 2D canvas).
 * Each shape has its own band; product-specific overrides in
 * DRINKWARE_UNWRAP_PRINT_INSETS_BY_PRODUCT_ID.
 */
export const MUG_UNWRAP_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 2,
  right: 4,
  bottom: 10,
  left: 4,
};

export const CUP_UNWRAP_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 6,
  right: 0,
  bottom: 18,
  left: 0,
};

export const THERMOS_UNWRAP_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 12,
  right: 0,
  bottom: 16,
  left: 0,
};

/** Glass beer mug (cup-glass-beer) — tall wall, thick base. */
export const GLASS_BEER_CUP_UNWRAP_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 3,
  right: 4,
  bottom: 10,
  left: 4,
};

/** Per-product unwrap overrides (when type alone is not enough). */
export const DRINKWARE_UNWRAP_PRINT_INSETS_BY_PRODUCT_ID: Record<
  string,
  PrintAreaInsets
> = {
  'cup-glass-beer': GLASS_BEER_CUP_UNWRAP_PRINT_AREA_INSETS,
};

const DRINKWARE_UNWRAP_BY_TYPE: Partial<Record<ProductType, PrintAreaInsets>> =
  {
    mug: MUG_UNWRAP_PRINT_AREA_INSETS,
    cup: CUP_UNWRAP_PRINT_AREA_INSETS,
    thermos: THERMOS_UNWRAP_PRINT_AREA_INSETS,
  };

/**
 * Printable band on the drinkware flat unwrap canvas (2D dashed guide + clamps).
 */
export function getDrinkwareUnwrapPrintInsets(
  type: ProductType,
  productId?: string,
): PrintAreaInsets {
  if (productId && DRINKWARE_UNWRAP_PRINT_INSETS_BY_PRODUCT_ID[productId]) {
    return DRINKWARE_UNWRAP_PRINT_INSETS_BY_PRODUCT_ID[productId];
  }
  return DRINKWARE_UNWRAP_BY_TYPE[type] ?? MUG_UNWRAP_PRINT_AREA_INSETS;
}

/** @deprecated Use MUG_UNWRAP_PRINT_AREA_INSETS */
export const DRINKWARE_PRINT_AREA_INSETS = MUG_UNWRAP_PRINT_AREA_INSETS;

/** @deprecated Use MUG_UNWRAP_PRINT_AREA_INSETS */
export const DRINKWARE_WRAP_PRINT_AREA_INSETS = MUG_UNWRAP_PRINT_AREA_INSETS;

/** @deprecated Use THERMOS_UNWRAP_PRINT_AREA_INSETS */
export const THERMOS_PRINT_AREA_INSETS = THERMOS_UNWRAP_PRINT_AREA_INSETS;

/** @deprecated Use THERMOS_UNWRAP_PRINT_AREA_INSETS */
export const THERMOS_WRAP_PRINT_AREA_INSETS = THERMOS_UNWRAP_PRINT_AREA_INSETS;

/** Cap front panel. */
export const CAP_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 16,
  right: 24,
  bottom: 37,
  left: 24,
};

/** Tote / bag face. */
export const BAG_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 36,
  right: 28,
  bottom: 7,
  left: 29,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Shrink insets so placement clamps allow content slightly past the dashed
 * print-area guide (admin authoring / customizer overshoot).
 */
export function expandPrintAreaInsets(
  insets: PrintAreaInsets,
  bleedPercent: number,
): PrintAreaInsets {
  if (bleedPercent <= 0) return insets;
  return {
    top: Math.max(0, insets.top - bleedPercent),
    right: Math.max(0, insets.right - bleedPercent),
    bottom: Math.max(0, insets.bottom - bleedPercent),
    left: Math.max(0, insets.left - bleedPercent),
  };
}

export function getUniformPrintAreaInsets(
  insetPercent: number,
): PrintAreaInsets {
  return {
    top: insetPercent,
    right: insetPercent,
    bottom: insetPercent,
    left: insetPercent,
  };
}

/** Max element width (% of mockup) from horizontal print span only. */
export function getPrintAreaMaxScale(insets: PrintAreaInsets): number {
  return getPrintAreaWidthPercent(insets);
}

/**
 * Max scale (% of parent width) for a centered image with a known aspect ratio.
 * Stops at whichever print dimension — width or height — is reached first.
 */
export function getMaxScaleForPrintArea(
  insets: PrintAreaInsets,
  imageAspectRatio: number,
  parentAspectRatio = 1,
): number {
  if (!imageAspectRatio || !parentAspectRatio) {
    return getPrintAreaMaxScale(insets);
  }

  const printWidth = getPrintAreaWidthPercent(insets);
  const printHeight = getPrintAreaHeightPercent(insets);
  const maxByHeight = (printHeight * imageAspectRatio) / parentAspectRatio;

  return Math.min(printWidth, maxByHeight);
}

export function getPrintAreaCenter(insets: PrintAreaInsets): {
  x: number;
  y: number;
} {
  return {
    x: insets.left + (100 - insets.left - insets.right) / 2,
    y: insets.top + (100 - insets.top - insets.bottom) / 2,
  };
}

export function getPrintAreaPositionPresets(insets: PrintAreaInsets): {
  center: { x: number; y: number };
  top: { x: number; y: number };
  bottom: { x: number; y: number };
} {
  const centerX = insets.left + (100 - insets.left - insets.right) / 2;
  const innerHeight = 100 - insets.top - insets.bottom;

  return {
    center: {
      x: centerX,
      y: insets.top + innerHeight / 2,
    },
    top: {
      x: centerX,
      y: insets.top + innerHeight * 0.28,
    },
    bottom: {
      x: centerX,
      y: insets.top + innerHeight * 0.72,
    },
  };
}

export function clampPointToPrintArea(
  position: { x: number; y: number },
  insets: PrintAreaInsets,
): { x: number; y: number } {
  return {
    x: clamp(position.x, insets.left, 100 - insets.right),
    y: clamp(position.y, insets.top, 100 - insets.bottom),
  };
}

/** Clamp a center-anchored element (translate -50%, -50%) inside the print area. */
export function clampCenterToPrintArea(
  position: { x: number; y: number },
  insets: PrintAreaInsets,
  sizePercent: { width: number; height: number },
): { x: number; y: number } {
  const halfW = sizePercent.width / 2;
  const halfH = sizePercent.height / 2;

  return {
    x: clamp(position.x, insets.left + halfW, 100 - insets.right - halfW),
    y: clamp(position.y, insets.top + halfH, 100 - insets.bottom - halfH),
  };
}

/**
 * True when an element's bounding box has zero overlap with the print area —
 * i.e. it was dragged/resized fully outside the printable region. Callers can
 * use this to offer a recovery (recenter) instead of clamping every frame.
 */
export function isElementFullyOutsidePrintArea(
  element: HTMLElement | null,
  parent: HTMLElement | null,
  insets: PrintAreaInsets,
  position: { x: number; y: number },
  fallbackSizePercent = { width: 8, height: 8 },
): boolean {
  const size =
    measureElementSizePercent(element, parent) ?? fallbackSizePercent;
  const halfW = size.width / 2;
  const halfH = size.height / 2;

  const left = position.x - halfW;
  const right = position.x + halfW;
  const top = position.y - halfH;
  const bottom = position.y + halfH;

  const areaLeft = insets.left;
  const areaRight = 100 - insets.right;
  const areaTop = insets.top;
  const areaBottom = 100 - insets.bottom;

  return (
    right <= areaLeft ||
    left >= areaRight ||
    bottom <= areaTop ||
    top >= areaBottom
  );
}

export function measureElementSizePercent(
  element: HTMLElement | null,
  parent: HTMLElement | null,
): { width: number; height: number } | null {
  if (!element || !parent) return null;

  const parentRect = parent.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  if (!parentRect.width || !parentRect.height) return null;

  return {
    width: (elementRect.width / parentRect.width) * 100,
    height: (elementRect.height / parentRect.height) * 100,
  };
}

/**
 * Union bounding box of all rendered design layers (image/text/sticker
 * overlays tagged with `data-customizer-content-layer`) inside `container`,
 * as a percent of `container`'s own size. Used to auto-detect whether a
 * design's actual footprint is small or large instead of asking the user
 * to pick a placement mode.
 */
export function measureContentLayersBoundsPercent(
  container: HTMLElement | null,
): { width: number; height: number } | null {
  if (!container) return null;

  const layers = container.querySelectorAll<HTMLElement>(
    '[data-customizer-content-layer]',
  );
  if (layers.length === 0) return null;

  const containerRect = container.getBoundingClientRect();
  if (!containerRect.width || !containerRect.height) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  layers.forEach((layer) => {
    const rect = layer.getBoundingClientRect();
    if (!rect.width && !rect.height) return;
    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxX = Math.max(maxX, rect.right);
    maxY = Math.max(maxY, rect.bottom);
  });

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;

  return {
    width: ((maxX - minX) / containerRect.width) * 100,
    height: ((maxY - minY) / containerRect.height) * 100,
  };
}

/** Width of the printable region as % of the mockup inner frame. */
export function getPrintAreaWidthPercent(insets: PrintAreaInsets): number {
  return 100 - insets.left - insets.right;
}

/** Height of the printable region as % of the mockup inner frame. */
export function getPrintAreaHeightPercent(insets: PrintAreaInsets): number {
  return 100 - insets.top - insets.bottom;
}

/** Suggested max font size (px) so a few lines fit inside the print zone. */
export function getMaxTextSizeForPrintArea(
  parentHeightPx: number,
  insets: PrintAreaInsets,
  lines = 4,
): number {
  if (!parentHeightPx) return 72;
  const printHeightPx =
    parentHeightPx * (getPrintAreaHeightPercent(insets) / 100);
  const maxByHeight = Math.floor(printHeightPx / lines / 1.2);
  return Math.min(72, Math.max(12, maxByHeight));
}

export function clampElementCenterToPrintArea(
  element: HTMLElement | null,
  parent: HTMLElement | null,
  insets: PrintAreaInsets,
  position: { x: number; y: number },
  fallbackSizePercent = { width: 8, height: 8 },
): { x: number; y: number } {
  const measured = measureElementSizePercent(element, parent);
  const size = measured ?? fallbackSizePercent;
  const printWidth = getPrintAreaWidthPercent(insets);
  const printHeight = getPrintAreaHeightPercent(insets);

  // If content is wider/taller than the zone, pin center to zone center.
  if (size.width >= printWidth - 0.5) {
    return {
      x: insets.left + printWidth / 2,
      y: clampCenterToPrintArea(position, insets, {
        width: Math.min(size.width, printWidth),
        height: size.height,
      }).y,
    };
  }

  if (size.height >= printHeight - 0.5) {
    return {
      x: clampCenterToPrintArea(position, insets, {
        width: size.width,
        height: Math.min(size.height, printHeight),
      }).x,
      y: insets.top + printHeight / 2,
    };
  }

  return clampCenterToPrintArea(position, insets, size);
}

export function getPrintAreaFrameStyle(insets: PrintAreaInsets): {
  top: string;
  right: string;
  bottom: string;
  left: string;
} {
  return {
    top: `${insets.top}%`,
    right: `${insets.right}%`,
    bottom: `${insets.bottom}%`,
    left: `${insets.left}%`,
  };
}

/**
 * CSS `clip-path` value that hides anything rendered outside the print
 * area rect. Apply to a wrapper that exactly overlaps the mockup frame
 * (same coordinate space as the insets) so overlays crossing the dashed
 * print-area border don't visibly spill onto the rest of the garment.
 */
export function getPrintAreaClipPath(insets: PrintAreaInsets): string {
  return `inset(${insets.top}% ${insets.right}% ${insets.bottom}% ${insets.left}%)`;
}
