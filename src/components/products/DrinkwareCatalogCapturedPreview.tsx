'use client';

import { useMemo, type ReactNode } from 'react';
import type { Product, ProductDesignTemplate, ProductSide } from '@/lib/data/catalog';
import { MockupLoadingOverlay } from '@/components/products/MockupLoadingOverlay';
import { ProductMockupFrame } from '@/components/products/ProductMockupFrame';
import { useDrinkwareCatalog3DCapture } from '@/hooks/useDrinkwareCatalog3DCapture';
import { resolveDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import { sideDesignFromOverlayTemplate } from '@/lib/products/design-state';
import {
  getOverlayPrintBounds,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';
import { cn } from '@/lib/utils';

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
  const sideDesign = useMemo(
    () => sideDesignFromOverlayTemplate(design, product, previewColor, side),
    [design, previewColor, product, side],
  );

  const captureOptions = useMemo(() => {
    if (!sideDesign) return null;
    return {
      productType: product.type,
      productId: product.id,
      productColor: previewColor,
      sideDesign,
      designTemplate: design,
      textLayers: sideDesign.textLayers,
      printBounds: getOverlayPrintBounds(mockupLayout),
    };
  }, [design, mockupLayout, previewColor, product.id, product.type, sideDesign]);

  const cacheKey = `${product.id}:${design.id}:${previewColor}:${side}`;
  const { rootRef, imageUrl, loading } = useDrinkwareCatalog3DCapture({
    enabled: Boolean(sideDesign),
    cacheKey,
    captureOptions,
  });

  return (
    <div ref={rootRef} className={cn('relative h-full w-full', className)}>
      {imageUrl ? (
        <ProductMockupFrame variant="catalog" layout={mockupLayout}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </ProductMockupFrame>
      ) : (
        <>
          {fallback}
          <MockupLoadingOverlay show={loading} />
        </>
      )}
    </div>
  );
}
