'use client';

import { useMemo } from 'react';
import {
  buildSublimationPatchSvgPath,
  getDrinkwareSublimationPatch,
} from '@/lib/products/drinkware-sublimation-patch';

const GUIDE_VIEWBOX = 1000;

type DrinkwareSublimationPatchGuideProps = {
  productId?: string;
  label: string;
};

/** Dashed outline of the printable sublimation patch on the flat unwrap. */
export function DrinkwareSublimationPatchGuide({
  productId,
  label,
}: DrinkwareSublimationPatchGuideProps) {
  const patch = getDrinkwareSublimationPatch(productId);
  const pathD = useMemo(
    () =>
      patch
        ? buildSublimationPatchSvgPath(patch, GUIDE_VIEWBOX, GUIDE_VIEWBOX)
        : '',
    [patch],
  );

  if (!patch || !pathD) return null;

  const { top, left } = patch.bounds;

  return (
    <div className="pointer-events-none absolute inset-0 z-[4]" aria-hidden>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${GUIDE_VIEWBOX} ${GUIDE_VIEWBOX}`}
        preserveAspectRatio="none"
      >
        <path
          d={pathD}
          fill="none"
          stroke="rgba(71, 85, 105, 0.55)"
          strokeWidth={2.5}
          strokeDasharray="10 7"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute hidden rounded bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-ink-600 shadow-sm md:inline"
        style={{
          left: `${left + 1.2}%`,
          top: `${top + 1.2}%`,
        }}
      >
        {label}
      </span>
    </div>
  );
}
