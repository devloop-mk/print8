/**
 * Printable region on the product mockup (percent of the mockup inner frame).
 *
 * Fine-tune per product type in:
 *   src/lib/products/product-mockup-layout.ts  →  layoutsByType / createMockupLayout()
 *
 * Global defaults:
 *   src/lib/products/customizer-constants.ts  →  PRODUCT_PRINT_AREA_INSET_PERCENT
 */

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
  top: 10,
  right: 27,
  bottom: 2,
  left: 26,
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
  right: 18,
  bottom: 33,
  left: 18,
};

/** Bodysuit front print zone. */
export const BODYSUIT_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 17,
  right: 31,
  bottom: 20,
  left: 31,
};

/** Mug / cup — front-center slice shown on the flat mockup preview. */
export const DRINKWARE_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 27,
  right: 35,
  bottom: 24,
  left: 23,
};

/**
 * Mug / cup — full cylinder wrap bounds for placement & scaling.
 * Horizontal insets are minimal so wide art can span around the drinkware.
 */
export const DRINKWARE_WRAP_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 27,
  right: 6,
  bottom: 24,
  left: 6,
};

/** Thermos — front-center slice on the flat mockup preview. */
export const THERMOS_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 25,
  right: 31,
  bottom: 10,
  left: 31,
};

/** Thermos — full cylinder wrap bounds for placement & scaling. */
export const THERMOS_WRAP_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 25,
  right: 14,
  bottom: 10,
  left: 14,
};

/** Cap front panel. */
export const CAP_PRINT_AREA_INSETS: PrintAreaInsets = {
  top: 24,
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
