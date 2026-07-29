'use client';

import { useId } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { getPrintAreaClipPath, type PrintAreaInsets } from '@/lib/products/print-area';
import {
  CustomizerPrintAreaMask,
  customizerPrintAreaMaskStyle,
} from '@/components/products/customizer/CustomizerPrintAreaMask';

export function CustomizerPrintAreaLayers({
  isCapturing,
  printAreaInsets,
  useDimOutsideMask,
  clipPathOverride,
  patchFillColor,
  children,
}: {
  isCapturing: boolean;
  printAreaInsets: PrintAreaInsets;
  /** Apparel mockups dim overflow; drinkware keeps a single unmasked stack. */
  useDimOutsideMask: boolean;
  /** Irregular patch outline (e.g. mug-red-patch sublimation field). */
  clipPathOverride?: string;
  /** White sublimation fill painted inside clipPathOverride (same layer as designs). */
  patchFillColor?: string;
  children: ReactNode;
}) {
  const maskId = useId().replace(/:/g, '');
  const clipPath =
    clipPathOverride ?? getPrintAreaClipPath(printAreaInsets);
  const clipStyle: CSSProperties = {
    clipPath,
    ...(patchFillColor ? { backgroundColor: patchFillColor } : null),
  };

  if (clipPathOverride) {
    return (
      <div
        className="absolute inset-0 z-[1] overflow-hidden pointer-events-auto"
        data-print-area-content
        data-print-area-insets={JSON.stringify(printAreaInsets)}
        style={clipStyle}
      >
        {children}
      </div>
    );
  }

  if (isCapturing && useDimOutsideMask) {
    return (
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        data-print-area-content
        data-print-area-insets={JSON.stringify(printAreaInsets)}
        style={clipStyle}
      >
        {children}
      </div>
    );
  }

  if (isCapturing || !useDimOutsideMask) {
    return (
      <div className="absolute inset-0 overflow-visible" data-print-area-content>
        {children}
      </div>
    );
  }

  const maskStyle = customizerPrintAreaMaskStyle(maskId);

  return (
    <div className="absolute inset-0 overflow-visible">
      <CustomizerPrintAreaMask maskId={maskId} insets={printAreaInsets} />
      <div
        className="absolute inset-0 overflow-visible"
        data-print-area-content
        style={maskStyle}
      >
        {children}
      </div>
    </div>
  );
}
