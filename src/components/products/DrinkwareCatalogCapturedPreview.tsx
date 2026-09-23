'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Product, ProductDesignTemplate, ProductSide } from '@/lib/data/catalog';
import { MockupLoadingOverlay } from '@/components/products/MockupLoadingOverlay';
import { ProductMockupFrame } from '@/components/products/ProductMockupFrame';
import { Drinkware3DPreview } from '@/components/products/customizer/Drinkware3DPreview';
import { useDrinkwareCatalog3DCapture } from '@/hooks/useDrinkwareCatalog3DCapture';
import { useDrinkwareDesignImageLayers } from '@/hooks/useDrinkwareDesignImageLayers';
import { resolveDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import { createDefaultSideDesign, sideDesignFromOverlayTemplate } from '@/lib/products/design-state';
import {
  getOverlayPrintBounds,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';
import { cn } from '@/lib/utils';

function useFinePointerHover() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setEnabled(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return enabled;
}

export function DrinkwareCatalogCapturedPreview({
  product,
  color,
  design,
  side,
  fallback,
  className,
}: {
  product: Product;
  color: string;
  design: ProductDesignTemplate;
  side: ProductSide;
  /** Flat 2D preview shown until the 3D still is ready. */
  fallback: ReactNode;
  className?: string;
}) {
  const previewColor = resolveDesignPreviewColor(design, product, color);
  const mockupLayout = getProductMockupLayout(product);
  const printBounds = useMemo(
    () => getOverlayPrintBounds(mockupLayout),
    [mockupLayout],
  );
  const sideDesign = useMemo(
    () => sideDesignFromOverlayTemplate(design, product, previewColor, side),
    [design, previewColor, product, side],
  );
  const { images, ready: layersReady } = useDrinkwareDesignImageLayers({
    shirtColor: previewColor,
    sideDesign: sideDesign ?? createDefaultSideDesign(),
    designTemplate: design,
  });

  const captureOptions = useMemo(() => {
    if (!sideDesign) return null;
    return {
      productType: product.type,
      productId: product.id,
      productColor: previewColor,
      sideDesign,
      designTemplate: design,
      textLayers: sideDesign.textLayers,
      printBounds,
    };
  }, [design, previewColor, printBounds, product.id, product.type, sideDesign]);

  const cacheKey = `${product.id}:${design.id}:${previewColor}:${side}`;
  const { rootRef, imageUrl, loading } = useDrinkwareCatalog3DCapture({
    enabled: Boolean(sideDesign),
    cacheKey,
    captureOptions,
  });

  const canHoverSpin = useFinePointerHover();
  const [spinLive, setSpinLive] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  function clearHoverTimer() {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }

  function onHoverStart() {
    if (!canHoverSpin || !sideDesign) return;
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setSpinLive(true), 70);
  }

  function onHoverEnd() {
    clearHoverTimer();
    hoverTimerRef.current = setTimeout(() => setSpinLive(false), 160);
  }

  const showLiveSpin = spinLive && Boolean(sideDesign) && layersReady;

  const liveScene = showLiveSpin ? (
    <div className="absolute inset-0 z-[1]">
      <Drinkware3DPreview
        productType={product.type}
        productId={product.id}
        productColor={previewColor}
        printBounds={printBounds}
        images={images}
        textLayers={sideDesign?.textLayers}
        stickers={sideDesign?.stickers}
        variant="catalog"
        className="absolute inset-0 h-full w-full"
      />
    </div>
  ) : null;

  return (
    <div
      ref={rootRef}
      className={cn('relative h-full w-full', className)}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      {imageUrl ? (
        <ProductMockupFrame variant="catalog" layout={mockupLayout}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
          />
          {liveScene}
        </ProductMockupFrame>
      ) : (
        <>
          {fallback}
          {liveScene}
          <MockupLoadingOverlay show={loading} />
        </>
      )}
    </div>
  );
}
