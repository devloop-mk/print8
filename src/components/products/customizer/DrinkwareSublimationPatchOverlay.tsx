'use client';

import { useMemo } from 'react';
import {
  buildSublimationPatchSvgPath,
  getDrinkwareSublimationPatch,
} from '@/lib/products/drinkware-sublimation-patch';

const OVERLAY_VIEWBOX = 1000;

type DrinkwareSublimationPatchOverlayProps = {
  productId?: string;
};

/**
 * Flat unwrap background for patch mugs: fixed body colour + white sublimation
 * field with scalloped / torn edges (matches 3D wrap texture).
 */
export function DrinkwareSublimationPatchOverlay({
  productId,
}: DrinkwareSublimationPatchOverlayProps) {
  const patch = getDrinkwareSublimationPatch(productId);
  const pathD = useMemo(
    () =>
      patch
        ? buildSublimationPatchSvgPath(patch, OVERLAY_VIEWBOX, OVERLAY_VIEWBOX)
        : '',
    [patch],
  );

  if (!patch || !pathD) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full"
      viewBox={`0 0 ${OVERLAY_VIEWBOX} ${OVERLAY_VIEWBOX}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={pathD} fill={patch.patchColor} />
      <defs>
        <linearGradient id="patch-shade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.05)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.035)" />
        </linearGradient>
      </defs>
      <path d={pathD} fill="url(#patch-shade)" />
    </svg>
  );
}
