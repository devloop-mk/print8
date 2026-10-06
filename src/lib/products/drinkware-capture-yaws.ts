import type { SideDesign } from '@/lib/products/design-state';
import { getPlacedPhotos } from '@/lib/products/photo-layers';

export type DrinkwareCaptureYaws = {
  front: number;
  preview: number;
  left: number;
  right: number;
};

/** Live 3D default — slight turn toward the main print. */
const PREVIEW_YAW_CLAMP = Math.PI / 4;
/** Front still — closer to wrap center than the 3D default. */
const FRONT_YAW_CLAMP = Math.PI / 8;
/** Face wrap-side art; slightly under 90° so the mug isn’t a flat profile. */
const SIDE_YAW_MAX = Math.PI / 2.05;

export function wrapUToCaptureYaw(u: number): number {
  return (u - 0.5) * Math.PI * 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type WeightedU = { u: number; weight: number };

function collectWrapContent(sideDesign: SideDesign): WeightedU[] {
  const items: WeightedU[] = [];
  for (const photo of getPlacedPhotos(sideDesign)) {
    items.push({ u: photo.position.x / 100, weight: photo.scale });
  }
  for (const layer of sideDesign.textLayers) {
    if (!layer.text.trim()) continue;
    items.push({ u: layer.position.x / 100, weight: layer.size });
  }
  for (const sticker of sideDesign.stickers) {
    items.push({ u: sticker.position.x / 100, weight: sticker.scale });
  }
  return items;
}

/**
 * Camera yaws for drinkware stills. `rotationY = 0` is handle-right / wrap
 * center (u=0.5). Side yaws aim at the leftmost / rightmost wrap art so
 * LEFT/RIGHT stills match where the print actually sits.
 */
export function getDrinkwareCaptureYaws(
  sideDesign: SideDesign,
): DrinkwareCaptureYaws {
  const items = collectWrapContent(sideDesign);
  if (items.length === 0) {
    return {
      front: 0,
      preview: 0,
      left: -SIDE_YAW_MAX,
      right: SIDE_YAW_MAX,
    };
  }

  const strongest = items.reduce((best, item) =>
    item.weight > best.weight ? item : best,
  );
  const leftItems = items.filter((item) => item.u < 0.45);
  const rightItems = items.filter((item) => item.u > 0.55);
  const centerItems = items.filter((item) => item.u >= 0.45 && item.u <= 0.55);

  const heroYaw = wrapUToCaptureYaw(strongest.u);
  const frontYaw = centerItems.length
    ? 0
    : clamp(heroYaw, -FRONT_YAW_CLAMP, FRONT_YAW_CLAMP);
  const previewYaw = centerItems.length
    ? 0
    : clamp(heroYaw, -PREVIEW_YAW_CLAMP, PREVIEW_YAW_CLAMP);

  const leftAnchor = leftItems.length
    ? leftItems.reduce((best, item) => (item.u < best.u ? item : best))
    : { u: 0.25, weight: 1 };
  const rightAnchor = rightItems.length
    ? rightItems.reduce((best, item) => (item.u > best.u ? item : best))
    : { u: 0.75, weight: 1 };

  return {
    front: frontYaw,
    preview: previewYaw,
    left: clamp(wrapUToCaptureYaw(leftAnchor.u), -SIDE_YAW_MAX, 0),
    right: clamp(wrapUToCaptureYaw(rightAnchor.u), 0, SIDE_YAW_MAX),
  };
}
