import type { ProductType } from '@/lib/data/catalog';

export type Drinkware3DMaterial = 'ceramic' | 'glass';

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
  material: Drinkware3DMaterial;
  /** Thicker glass foot at the base (glass beer mug). */
  baseHeight?: number;
  /**
   * Remap cylinder UVs so the bottom of the wrap texture maps above the
   * physical base — keeps art centered on the visible glass wall.
   */
  wrapUvBottomInset?: number;
  wrapUvTopInset?: number;
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
  material: 'ceramic',
};

/** Generic cup (non-glass) — short tapered tumbler, no handle. */
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
  material: 'ceramic',
};

/**
 * Glass beer mug (cup-glass-beer) — straight tall cylinder, D-handle,
 * proportions matched to the 2D product photo (~1.5× height vs diameter).
 */
const GLASS_BEER_CUP_CONFIG: Drinkware3DConfig = {
  radiusTop: 0.41,
  radiusBottom: 0.41,
  height: 1.24,
  hasHandle: true,
  hasLid: false,
  lidHeight: 0.1,
  cameraZ: 2.85,
  handleGapFraction: 0.08,
  wallThickness: 0.016,
  material: 'glass',
  baseHeight: 0.055,
  wrapUvBottomInset: 0.11,
  wrapUvTopInset: 0.03,
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
  material: 'ceramic',
};

const configs: Partial<Record<ProductType, Drinkware3DConfig>> = {
  mug: MUG_CONFIG,
  cup: CUP_CONFIG,
  thermos: THERMOS_CONFIG,
};

const productConfigs: Record<string, Drinkware3DConfig> = {
  'cup-glass-beer': GLASS_BEER_CUP_CONFIG,
};

export function getDrinkware3DConfig(
  type: ProductType,
  productId?: string,
): Drinkware3DConfig {
  if (productId && productConfigs[productId]) {
    return productConfigs[productId];
  }
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
export function getDrinkwareWrapAspect(
  type: ProductType,
  productId?: string,
): number {
  const config = getDrinkware3DConfig(type, productId);
  const avgRadius = (config.radiusTop + config.radiusBottom) / 2;
  return (2 * Math.PI * avgRadius) / config.height;
}

export function getDrinkwareWrapTextureSize(
  type: ProductType,
  productId?: string,
): DrinkwareWrapTextureSize {
  const aspect = getDrinkwareWrapAspect(type, productId);
  const height = DRINKWARE_WRAP_TEXTURE_HEIGHT;
  const width = Math.max(512, Math.round((height * aspect) / 64) * 64);
  return { width, height };
}

/** Flat unwrap editor size in CSS px — same aspect as the wrap texture. */
export function getDrinkwareFlatCanvasSize(
  type: ProductType,
  productId?: string,
): {
  width: number;
  height: number;
  aspect: number;
} {
  const aspect = getDrinkwareWrapAspect(type, productId);
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

export function getHandleGapEdgeFraction(
  type: ProductType,
  productId?: string,
): number {
  return getDrinkware3DConfig(type, productId).handleGapFraction / 2;
}
