'use client';

import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { Shirt } from 'lucide-react';
import {
  getProductMockup,
  type Product,
  type ProductSide,
} from '@/lib/data/catalog';
import {
  getMockupImageDisplayStyle,
  getOverlayPrintBounds,
  getProductMockupLayout,
  isCylindricalDrinkwareType,
} from '@/lib/products/product-mockup-layout';
import { PRODUCT_PRINT_AREA_MAX_SCALE } from '@/lib/products/customizer-constants';
import { clampPhotoScale } from '@/lib/products/crop-image';
import { usePrintAreaMaxScale } from '@/lib/products/use-print-area-max-scale';
import type { BrandingPackLogoPlacement } from '@/lib/products/branding-pack-config';
import { PrintAreaGuideSwitch } from '@/components/products/customizer/PrintAreaGuideSwitch';
import {
  DrinkwareWrapHint,
} from '@/components/products/customizer/DrinkwarePrintAreaGuide';
import {
  Drinkware3DPreviewLazy,
  DrinkwarePreviewModeToggle,
  type DrinkwarePreviewMode,
} from '@/components/products/customizer/Drinkware3DPreviewLazy';
import { BrandingPackLogoOverlay } from '@/components/products/branding-pack/BrandingPackLogoOverlay';
import { cn } from '@/lib/utils';

type BrandingPackMockupProps = {
  product: Product;
  color: string;
  side?: ProductSide;
  logoUrl?: string;
  placement?: BrandingPackLogoPlacement;
  typeLabel: string;
  printAreaLabel: string;
  wrapAreaLabel?: string;
  frontPreviewLabel?: string;
  drinkwareWrapHint?: string;
  interactive?: boolean;
  onLogoScaleChange?: (scale: number) => void;
  onLogoPositionChange?: (pos: { x: number; y: number }) => void;
  className?: string;
};

export const BrandingPackMockup = forwardRef<
  HTMLDivElement,
  BrandingPackMockupProps
>(function BrandingPackMockup(
  {
    product,
    color,
    side = 'front',
    logoUrl,
    placement,
    typeLabel,
    printAreaLabel,
    wrapAreaLabel,
    frontPreviewLabel,
    drinkwareWrapHint,
    interactive = false,
    onLogoScaleChange,
    onLogoPositionChange,
    className = '',
  },
  ref,
) {
  const mockupLayout = getProductMockupLayout(product);
  const overlayPrintBounds = getOverlayPrintBounds(mockupLayout);
  const isDrinkware = isCylindricalDrinkwareType(product.type);
  const [previewMode, setPreviewMode] = useState<DrinkwarePreviewMode>('flat');
  const mockupFrameRef = useRef<HTMLDivElement | null>(null);
  const imageMaxScale = usePrintAreaMaxScale(
    mockupFrameRef,
    overlayPrintBounds,
    logoUrl,
    mockupLayout.overlayMaxScale ?? PRODUCT_PRINT_AREA_MAX_SCALE,
  );

  const drinkwareImages = useMemo(
    () =>
      logoUrl && placement
        ? [
            {
              src: logoUrl,
              scale: placement.scale,
              position: placement.position,
            },
          ]
        : [],
    [logoUrl, placement],
  );

  const show3dPreview = isDrinkware && interactive && previewMode === '3d';

  useEffect(() => {
    if (!interactive || !placement || placement.scale <= imageMaxScale) return;
    onLogoScaleChange?.(clampPhotoScale(placement.scale, imageMaxScale));
  }, [imageMaxScale, placement, interactive, onLogoScaleChange]);

  const baseImage =
    getProductMockup(product, color, side) ?? product.image;
  const mockupStyle = getMockupImageDisplayStyle(
    product,
    baseImage,
    'customizer',
  );

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
    {isDrinkware && interactive ? (
      <DrinkwarePreviewModeToggle
        mode={previewMode}
        onChange={setPreviewMode}
      />
    ) : null}

    {show3dPreview ? (
      <Drinkware3DPreviewLazy
        productType={product.type}
        productColor={color}
        printBounds={overlayPrintBounds}
        images={drinkwareImages}
        className="max-w-md w-full"
      />
    ) : null}

    <div
      ref={(node) => {
        mockupFrameRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn(
        'relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl border border-ink-100 bg-white',
        show3dPreview && 'hidden',
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div data-mockup-inner className={`${mockupLayout.innerClass} overflow-hidden`}>
          <div className="relative h-full w-full" style={mockupStyle}>
          {baseImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={baseImage}
              alt={typeLabel}
              draggable={false}
              crossOrigin="anonymous"
              className={mockupLayout.imageClass}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Shirt className="h-24 w-24 text-ink-300" />
            </div>
          )}

          {interactive ? (
            <PrintAreaGuideSwitch
              layout={mockupLayout}
              label={printAreaLabel}
              wrapLabel={wrapAreaLabel ?? printAreaLabel}
              frontLabel={frontPreviewLabel ?? printAreaLabel}
            />
          ) : null}

          {logoUrl && placement ? (
            <BrandingPackLogoOverlay
              src={logoUrl}
              alt="Logo"
              scale={placement.scale}
              position={placement.position}
              onScaleChange={onLogoScaleChange}
              onPositionChange={onLogoPositionChange}
              maxScale={imageMaxScale}
              printBounds={overlayPrintBounds}
              interactive={interactive}
            />
          ) : null}
          </div>
        </div>
      </div>
    </div>
    {interactive && mockupLayout.wrapPrintArea && drinkwareWrapHint && previewMode === 'flat' ? (
      <DrinkwareWrapHint className="max-w-md px-2">
        {drinkwareWrapHint}
      </DrinkwareWrapHint>
    ) : null}
    </div>
  );
});
