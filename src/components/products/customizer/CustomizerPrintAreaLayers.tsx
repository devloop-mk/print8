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
  children,
}: {
  isCapturing: boolean;
  printAreaInsets: PrintAreaInsets;
  /** Apparel mockups dim overflow; drinkware keeps a single unmasked stack. */
  useDimOutsideMask: boolean;
  children: ReactNode;
}) {
  const maskId = useId().replace(/:/g, '');
  const clipPath = getPrintAreaClipPath(printAreaInsets);
  const clipStyle: CSSProperties = { clipPath };

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
