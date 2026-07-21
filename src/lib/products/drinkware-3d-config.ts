import type { ProductType } from '@/lib/data/catalog';
import type { PrintAreaInsets } from '@/lib/products/print-area';

export type Drinkware3DConfig = {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  /** Show a mug handle on the UV seam (+X) */
  hasHandle: boolean;
  /** Show a thermos screw lid */
  hasLid: boolean;
  /** Lid height relative to body height */
  lidHeight: number;
  /** Default camera distance */
  cameraZ: number;
  /**
   * Fraction of the cylinder circumference reserved for the handle seam.
   * Cleared in the wrap texture (left+right edges) so art never prints under the handle.
   */
  handleGapFraction: number;
  /** Wall thickness for hollow ceramic look (outer − inner radius). */
  wallThickness: number;
};

/**
 * Classic ceramic mug — proportions closer to an 11oz blank:
 * slight taper, taller than wide, C-handle at the UV seam.
 */
const MUG_CONFIG: Drinkware3DConfig = {
  radiusTop: 0.46,
  radiusBottom: 0.43,
  height: 1.08,
  hasHandle: true,
  hasLid: false,
  lidHeight: 0.12,
  cameraZ: 2.85,
  /** ~4% per side — tight clear zone so art can sit close to the handle. */
  handleGapFraction: 0.08,
  wallThickness: 0.045,
};

const CUP_CONFIG: Drinkware3DConfig = {
  radiusTop: 0.48,
  radiusBottom: 0.4,
  height: 0.82,
  hasHandle: false,
  hasLid: false,
  lidHeight: 0.1,
  cameraZ: 2.55,
  handleGapFraction: 0,
  wallThickness: 0.04,
};

const THERMOS_CONFIG: Drinkware3DConfig = {
  radiusTop: 0.36,
  radiusBottom: 0.36,
  height: 1.22,
  hasHandle: false,
  hasLid: true,
  lidHeight: 0.13,
  cameraZ: 3.2,
  handleGapFraction: 0,
  wallThickness: 0.035,
};

const configs: Partial<Record<ProductType, Drinkware3DConfig>> = {
  mug: MUG_CONFIG,
  cup: CUP_CONFIG,
  thermos: THERMOS_CONFIG,
};

export function getDrinkware3DConfig(type: ProductType): Drinkware3DConfig {
  return configs[type] ?? MUG_CONFIG;
}

/** Wrap texture height — width is derived from full cylinder circumference. */
export const DRINKWARE_WRAP_TEXTURE_HEIGHT = 768;

/**
 * CSS height of the flat unwrap editor. Keep the editor canvas at this height
 * (width = height × wrap aspect) so text px maps 1:1 into the wrap texture.
 */
export const DRINKWARE_FLAT_CANVAS_HEIGHT_PX = 360;

export type DrinkwareWrapTextureSize = {
  width: number;
  height: number;
};

/**
 * Full unwrapped cylinder aspect (circumference ÷ height).
 * The flat 2D editor uses this same aspect so % positions map 1:1 to UVs.
 */
export function getDrinkwareWrapAspect(type: ProductType): number {
  const config = getDrinkware3DConfig(type);
  const avgRadius = (config.radiusTop + config.radiusBottom) / 2;
  return (2 * Math.PI * avgRadius) / config.height;
}

export function getDrinkwareWrapTextureSize(
  type: ProductType,
): DrinkwareWrapTextureSize {
  const aspect = getDrinkwareWrapAspect(type);
  const height = DRINKWARE_WRAP_TEXTURE_HEIGHT;
  const width = Math.max(512, Math.round((height * aspect) / 64) * 64);
  return { width, height };
}

/** Flat unwrap editor size in CSS px — same aspect as the wrap texture. */
export function getDrinkwareFlatCanvasSize(type: ProductType): {
  width: number;
  height: number;
  aspect: number;
} {
  const aspect = getDrinkwareWrapAspect(type);
  const height = DRINKWARE_FLAT_CANVAS_HEIGHT_PX;
  return { width: Math.round(height * aspect), height, aspect };
}

/**
 * Scale factor from flat-editor % width → wrap texture width.
 * Always 1 when the 2D canvas IS the unwrap (same aspect as the texture).
 */
export function getDrinkwareWrapScaleFactor(
  _type: ProductType,
  _printBounds: PrintAreaInsets,
): number {
  return 1;
}

/**
 * Maps flat-editor text size (CSS px) to wrap-texture font size with a true
 * height ratio. Prefer the measured canvas height; fall back to the reference.
 */
export function getDrinkwareTextureFontSize(
  layerSizePx: number,
  textureHeight: number,
  canvasHeightPx?: number,
): number {
  const refHeight =
    canvasHeightPx && canvasHeightPx > 0
      ? canvasHeightPx
      : DRINKWARE_FLAT_CANVAS_HEIGHT_PX;
  return Math.max(8, Math.round(layerSizePx * (textureHeight / refHeight)));
}

/** Half of the handle gap as a fraction of texture/canvas width (each edge). */
export function getHandleGapEdgeFraction(type: ProductType): number {
  return getDrinkware3DConfig(type).handleGapFraction / 2;
}

/**
 * Print-area insets for the flat unwrap editor.
 * Horizontal insets match the handle gap so overlays cannot enter the seam.
 */
export function getDrinkwareUnwrapPrintInsets(type: ProductType): PrintAreaInsets {
  const edge = Math.round(getHandleGapEdgeFraction(type) * 1000) / 10;
  if (type === 'thermos') {
    return { top: 8, right: 0, bottom: 14, left: 0 };
  }
  if (type === 'cup') {
    return { top: 6, right: 0, bottom: 16, left: 0 };
  }
  // Full mug body height; horizontal insets match the handle seam gap.
  return { top: 0, right: edge, bottom: 0, left: edge };
}
