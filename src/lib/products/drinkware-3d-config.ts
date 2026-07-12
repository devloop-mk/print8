import type { ProductType } from '@/lib/data/catalog';
import {
  getPrintAreaWidthPercent,
  type PrintAreaInsets,
} from '@/lib/products/print-area';

export type Drinkware3DConfig = {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  /** Show a mug handle on the right side */
  hasHandle: boolean;
  /** Show a thermos screw lid */
  hasLid: boolean;
  /** Lid height relative to body height */
  lidHeight: number;
  /** Default camera distance */
  cameraZ: number;
};

const MUG_CONFIG: Drinkware3DConfig = {
  radiusTop: 0.52,
  radiusBottom: 0.48,
  height: 1.05,
  hasHandle: true,
  hasLid: false,
  lidHeight: 0.12,
  cameraZ: 2.8,
};

const CUP_CONFIG: Drinkware3DConfig = {
  radiusTop: 0.5,
  radiusBottom: 0.42,
  height: 0.78,
  hasHandle: false,
  hasLid: false,
  lidHeight: 0.1,
  cameraZ: 2.6,
};

const THERMOS_CONFIG: Drinkware3DConfig = {
  radiusTop: 0.38,
  radiusBottom: 0.38,
  height: 1.18,
  hasHandle: false,
  hasLid: true,
  lidHeight: 0.11,
  cameraZ: 3.15,
};

const configs: Partial<Record<ProductType, Drinkware3DConfig>> = {
  mug: MUG_CONFIG,
  cup: CUP_CONFIG,
  thermos: THERMOS_CONFIG,
};

export function getDrinkware3DConfig(type: ProductType): Drinkware3DConfig {
  return configs[type] ?? MUG_CONFIG;
}

/** Wrap texture height — width is derived from cylinder proportions. */
export const DRINKWARE_WRAP_TEXTURE_HEIGHT = 512;

export type DrinkwareWrapTextureSize = {
  width: number;
  height: number;
};

/** Unwrapped cylinder aspect (circumference ÷ height) drives undistorted UV mapping. */
export function getDrinkwareWrapTextureSize(
  type: ProductType,
): DrinkwareWrapTextureSize {
  const config = getDrinkware3DConfig(type);
  const avgRadius = (config.radiusTop + config.radiusBottom) / 2;
  const aspect = (2 * Math.PI * avgRadius) / config.height;
  const height = DRINKWARE_WRAP_TEXTURE_HEIGHT;
  const width = Math.max(512, Math.round((height * aspect) / 64) * 64);

  return { width, height };
}

/**
 * Converts flat-preview scale (% of mockup frame) to 3D wrap texture width.
 * Thermos flat photos read narrower than the full cylinder unwrap; mugs show more wrap on the front.
 */
export function getDrinkwareWrapScaleFactor(
  type: ProductType,
  printBounds: PrintAreaInsets,
): number {
  const printWidthFraction = getPrintAreaWidthPercent(printBounds) / 100;

  if (type === 'thermos') {
    return 1;
  }

  return printWidthFraction;
}

/** Reference height of the flat customizer mockup inner frame (CSS px). */
export const DRINKWARE_MOCKUP_INNER_REF_PX = 360;

/**
 * Maps flat-preview text size (CSS px on the mockup) to wrap-texture font size.
 * The 3D cylinder body renders smaller in the shared preview panel than the photo mockup.
 */
export function getDrinkwareTextureFontSize(
  layerSizePx: number,
  textureHeight: number,
  productType: ProductType,
): number {
  const mockupToTexture = textureHeight / DRINKWARE_MOCKUP_INNER_REF_PX;
  const viewportBoost: Partial<Record<ProductType, number>> = {
    thermos: 3.35,
    mug: 2.55,
    cup: 2.7,
  };

  return Math.max(
    12,
    Math.round(layerSizePx * mockupToTexture * (viewportBoost[productType] ?? 2.8)),
  );
}
