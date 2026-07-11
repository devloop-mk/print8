import type { ProductType } from '@/lib/data/catalog';

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
  radiusTop: 0.44,
  radiusBottom: 0.46,
  height: 1.2,
  hasHandle: false,
  hasLid: true,
  lidHeight: 0.14,
  cameraZ: 3,
};

const configs: Partial<Record<ProductType, Drinkware3DConfig>> = {
  mug: MUG_CONFIG,
  cup: CUP_CONFIG,
  thermos: THERMOS_CONFIG,
};

export function getDrinkware3DConfig(type: ProductType): Drinkware3DConfig {
  return configs[type] ?? MUG_CONFIG;
}

/** Wrap texture resolution — wide strip mapped around the cylinder. */
export const DRINKWARE_WRAP_TEXTURE_WIDTH = 2048;
export const DRINKWARE_WRAP_TEXTURE_HEIGHT = 512;
