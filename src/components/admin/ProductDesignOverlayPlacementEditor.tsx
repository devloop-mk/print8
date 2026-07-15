'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getProductMockup,
  products,
  type Product,
  type ProductDesignSideOverlay,
  type ProductDesignTemplate,
  type ProductSide,
  type ProductType,
} from '@/lib/data/catalog';
import { PRODUCT_TYPE_LABELS_MK } from '@/lib/admin/product-designs-shared';
import { ProductMockupFrame } from '@/components/products/ProductMockupFrame';
import { PrintAreaGuide } from '@/components/products/customizer/PrintAreaGuide';
import { resolveDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import {
  resolveOverlayPlacement,
  resolveSideOverlayPlacement,
} from '@/lib/products/design-overlay';
import {
  getMockupImageDisplayStyle,
  getOverlayPrintBounds,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';
import {
  clampElementCenterToPrintArea,
} from '@/lib/products/print-area';
import { clampPhotoScale } from '@/lib/products/crop-image';
import {
  PRODUCT_PHOTO_MIN_SCALE,
} from '@/lib/products/customizer-constants';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import {
  useDraggableOverlayPosition,
  useOverlayScaleResize,
} from '@/hooks/useOverlayPlacementControls';
import { cn } from '@/lib/utils';

const PREVIEW_PRODUCT_BY_TYPE: Partial<Record<ProductType, string>> = {
  cup: 'cup-glass-beer',
  mug: 'mug-classic',
  thermos: 'thermos-classic',
  't-shirt': 'tshirt-basic-white',
  hoodie: 'hoodie-basic',
  cap: 'cap-classic',
  bag: 'bag-tote',
  bodysuit: 'bodysuit-basic',
};

function previewProductForType(type: ProductType): Product | null {
  const preferredId = PREVIEW_PRODUCT_BY_TYPE[type];
  if (preferredId) {
    return products.find((product) => product.id === preferredId) ?? null;
  }
  return products.find((product) => product.type === type) ?? null;
}

type PlacementValue = {
  scale: number;
  position: { x: number; y: number };
};

type ProductDesignOverlayPlacementEditorProps = {
  template: ProductDesignTemplate;
  /** Persist placement for the currently selected product type. */
  onPlacementChange: (productType: ProductType, next: PlacementValue) => void;
  /** Mockup side to preview (defaults to template.defaultSide). */
  previewSide?: ProductSide;
  /**
   * Overlay asset + placement source for this side.
   * Front uses template fields; back uses backOverlay.
   */
  overlayConfig?: Pick<
    ProductDesignSideOverlay,
    | 'overlayImage'
    | 'overlaySvg'
    | 'overlayColorVariants'
    | 'overlayScale'
    | 'overlayPosition'
    | 'overlayByProductType'
  >;
  title?: string;
};

export function ProductDesignOverlayPlacementEditor({
  template,
  onPlacementChange,
  previewSide,
  overlayConfig,
  title,
}: ProductDesignOverlayPlacementEditorProps) {
  const previewTypes = template.productTypes.length
    ? template.productTypes
    : (['t-shirt'] as ProductType[]);
  const [previewType, setPreviewType] = useState<ProductType>(previewTypes[0]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!previewTypes.includes(previewType)) {
      setPreviewType(previewTypes[0]);
    }
  }, [previewTypes, previewType]);

  const sideOverlay = overlayConfig ?? {
    overlayImage: template.overlayImage,
    overlaySvg: template.overlaySvg,
    overlayColorVariants: template.overlayColorVariants,
    overlayScale: template.overlayScale,
    overlayPosition: template.overlayPosition,
    overlayByProductType: template.overlayByProductType,
  };

  const placement = useMemo(() => {
    if (overlayConfig) {
      return resolveSideOverlayPlacement(overlayConfig, previewType);
    }
    return resolveOverlayPlacement(template, previewType);
  }, [
    overlayConfig,
    previewType,
    template,
  ]);

  const hasTypeOverride = Boolean(
    (overlayConfig ?? template).overlayByProductType?.[previewType],
  );

  const previewProduct = useMemo(
    () => previewProductForType(previewType),
    [previewType],
  );

  const previewColor = useMemo(() => {
    if (!previewProduct) return '#ffffff';
    return resolveDesignPreviewColor(
      template,
      previewProduct,
      previewProduct.colors?.[0],
    );
  }, [previewProduct, template]);

  const mockupLayout = useMemo(
    () =>
      previewProduct
        ? getProductMockupLayout(previewProduct)
        : getProductMockupLayout('mug'),
    [previewProduct],
  );

  const printBounds = getOverlayPrintBounds(mockupLayout);
  const overlaySrc = sideOverlay.overlayImage
    ? resolveAssetUrl(sideOverlay.overlayImage)
    : sideOverlay.overlaySvg
      ? resolveAssetUrl(sideOverlay.overlaySvg)
      : null;

  const commitPlacement = (next: PlacementValue) => {
    onPlacementChange(previewType, next);
  };

  const drag = useDraggableOverlayPosition(
    placement.position,
    (nextPosition) =>
      commitPlacement({ scale: placement.scale, position: nextPosition }),
    printBounds,
    containerRef,
  );

  const resize = useOverlayScaleResize(
    placement.scale,
    (nextScale) => {
      const clamped = clampPhotoScale(nextScale, mockupLayout.overlayMaxScale);
      if (!containerRef.current?.parentElement) {
        commitPlacement({ scale: clamped, position: placement.position });
        return;
      }
      const reclamped = clampElementCenterToPrintArea(
        containerRef.current,
        containerRef.current.parentElement,
        printBounds,
        placement.position,
        { width: clamped, height: clamped },
      );
      commitPlacement({ scale: clamped, position: reclamped });
    },
    PRODUCT_PHOTO_MIN_SCALE,
    mockupLayout.overlayMaxScale,
  );

  if (!overlaySrc || !previewProduct) {
    return (
      <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50 p-4 text-sm text-ink-500">
        Додајте overlayImage и изберете барем еден тип производ за
        интерактивен преглед.
      </div>
    );
  }

  const mockupSide = previewSide ?? template.defaultSide;
  const mockup = getProductMockup(previewProduct, previewColor, mockupSide);
  const mockupStyle = getMockupImageDisplayStyle(
    previewProduct,
    mockup ?? undefined,
    'customizer',
  );

  return (
    <section className="space-y-3 rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">
            {title ?? 'Позиција по тип производ'}
          </h3>
          <p className="text-xs text-ink-500">
            Изберете тип, па повлечете / скалирајте — секој тип се зачувува
            посебно.
            {hasTypeOverride ? (
              <span className="ml-1 font-medium text-brand-700">
                (прилагодено за {PRODUCT_TYPE_LABELS_MK[previewType]})
              </span>
            ) : (
              <span className="ml-1 text-ink-400">
                (основна позиција — уредете за да зачувате за овој тип)
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-ink-200 p-1">
        {previewTypes.map((type) => {
          const customized = Boolean(sideOverlay.overlayByProductType?.[type]);
          return (
            <button
              key={type}
              type="button"
              onClick={() => setPreviewType(type)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs font-medium',
                previewType === type
                  ? 'bg-brand-700 text-white'
                  : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              {PRODUCT_TYPE_LABELS_MK[type] ?? type}
              {customized ? (
                <span
                  className={cn(
                    'ml-1 inline-block h-1.5 w-1.5 rounded-full',
                    previewType === type ? 'bg-white' : 'bg-brand-500',
                  )}
                  title="Прилагодена позиција"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mx-auto max-w-md">
        <ProductMockupFrame
          variant="customizer"
          layout={mockupLayout}
          innerStyle={mockupStyle}
        >
          {mockup ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mockup}
              alt=""
              draggable={false}
              className={mockupLayout.imageClass}
            />
          ) : null}

          <PrintAreaGuide insets={printBounds} label="Print area" />

          <div
            ref={(node) => {
              containerRef.current = node;
              drag.ref.current = node;
            }}
            className="absolute z-[5] cursor-grab active:cursor-grabbing"
            style={{
              left: `${placement.position.x}%`,
              top: `${placement.position.y}%`,
              width: `${placement.scale}%`,
              transform: 'translate(-50%, -50%)',
              touchAction: 'none',
            }}
            onPointerDown={drag.onPointerDown}
            onPointerMove={drag.onPointerMove}
            onPointerUp={drag.onPointerUp}
            onPointerCancel={drag.onPointerCancel}
          >
            <div className="relative rounded ring-2 ring-brand-500 ring-offset-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={overlaySrc}
                alt=""
                draggable={false}
                className="pointer-events-none block w-full object-contain"
              />
              <div
                role="button"
                tabIndex={0}
                aria-label="Resize overlay"
                className="absolute -bottom-2 -right-2 flex h-6 w-6 cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-md"
                style={{ touchAction: 'none' }}
                onPointerDown={resize.onPointerDown}
                onPointerMove={resize.onPointerMove}
                onPointerUp={resize.onPointerUp}
                onPointerCancel={resize.onPointerCancel}
              >
                <svg viewBox="0 0 10 10" className="h-3 w-3 text-white" aria-hidden>
                  <path
                    d="M9 1v8H1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
            </div>
          </div>
        </ProductMockupFrame>
      </div>
    </section>
  );
}
