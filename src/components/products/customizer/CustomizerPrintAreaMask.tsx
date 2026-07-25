'use client';

import { PRODUCT_CUSTOMIZER_OUTSIDE_PRINT_AREA_OPACITY } from '@/lib/products/customizer-constants';
import type { PrintAreaInsets } from '@/lib/products/print-area';

/**
 * SVG mask in mockup coordinates (objectBoundingBox 0–1).
 * Applied to the full mockup overlay stack so inside the print rect = 100%
 * opacity and outside = dimmed (default 15%).
 */
export function CustomizerPrintAreaMask({
  maskId,
  insets,
}: {
  maskId: string;
  insets: PrintAreaInsets;
}) {
  const x = insets.left / 100;
  const y = insets.top / 100;
  const width = (100 - insets.left - insets.right) / 100;
  const height = (100 - insets.top - insets.bottom) / 100;
  const outsideOpacity = PRODUCT_CUSTOMIZER_OUTSIDE_PRINT_AREA_OPACITY;

  return (
    <svg
      width="0"
      height="0"
      className="pointer-events-none absolute"
      aria-hidden
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="objectBoundingBox"
          maskContentUnits="objectBoundingBox"
        >
          <rect
            width="1"
            height="1"
            fill="white"
            fillOpacity={outsideOpacity}
          />
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="white"
            fillOpacity={1}
          />
        </mask>
      </defs>
    </svg>
  );
}

export function customizerPrintAreaMaskStyle(maskId: string): {
  maskImage: string;
  WebkitMaskImage: string;
  maskSize: string;
  WebkitMaskSize: string;
  maskRepeat: 'no-repeat';
  WebkitMaskRepeat: 'no-repeat';
} {
  const ref = `url(#${maskId})`;
  return {
    maskImage: ref,
    WebkitMaskImage: ref,
    maskSize: '100% 100%',
    WebkitMaskSize: '100% 100%',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
  };
}
