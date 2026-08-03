'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
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
  getDesignCompositeOverlayUrl,
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
  expandPrintAreaInsets,
  getPrintAreaCenter,
} from '@/lib/products/print-area';
import { clampPhotoScale } from '@/lib/products/crop-image';
import {
  ADMIN_OVERLAY_PRINT_AREA_BLEED_PERCENT,
  getAdminOverlayMaxScale,
  PRODUCT_PHOTO_MIN_SCALE,
} from '@/lib/products/customizer-constants';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import {
  useDraggableOverlayPosition,
  useOverlayScaleResize,
} from '@/hooks/useOverlayPlacementControls';
import { usePrintAreaMaxScale } from '@/lib/products/use-print-area-max-scale';
import { cn } from '@/lib/utils';

const DEFAULT_ADMIN_OVERLAY_SCALE = 40;

const PREVIEW_PRODUCT_BY_TYPE: Partial<Record<ProductType, string>> = {
  cup: 'cup-glass-beer',
  mug: 'mug-classic',
  thermos: 'thermos-classic',
  't-shirt': 'tshirt-unisex',
  hoodie: 'hoodie-basic',
  cap: 'cap-classic',
  bag: 'bag-tote',
  bodysuit: 'bodysuit-basic',
};

const HANDLE_PAD_PX = 14;

function previewProductForType(type: ProductType): Product | null {
  const preferredId = PREVIEW_PRODUCT_BY_TYPE[type];
  if (preferredId) {
    return products.find((product) => product.id === preferredId) ?? null;
  }
  return products.find((product) => product.type === type) ?? null;
}

/**
 * Keep the SE resize handle inside the visible mockup frame even when the
 * overlay bbox overflows (overflow-hidden clips corner-mounted handles).
 */
function useViewportClampedHandlePosition(
  overlayRef: RefObject<HTMLElement | null>,
  frameRef: RefObject<HTMLElement | null>,
  deps: unknown[],
) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const frame = frameRef.current;
    if (!overlay || !frame) {
      setPos(null);
      return;
    }

    const update = () => {
      const o = overlay.getBoundingClientRect();
      const f = frame.getBoundingClientRect();
      if (!f.width || !f.height) return;

      // True SE corner of the overlay, relative to the frame.
      let x = o.right - f.left;
      let y = o.bottom - f.top;

      x = Math.min(Math.max(x, HANDLE_PAD_PX), f.width - HANDLE_PAD_PX);
      y = Math.min(Math.max(y, HANDLE_PAD_PX), f.height - HANDLE_PAD_PX);
      setPos({ left: x, top: y });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(overlay);
    observer.observe(frame);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes explicit deps
  }, deps);

  return pos;
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
  const frameRef = useRef<HTMLDivElement | null>(null);

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
      return resolveSideOverlayPlacement(
        overlayConfig,
        previewType,
        template.productTypes,
      );
    }
    return resolveOverlayPlacement(template, previewType);
  }, [overlayConfig, previewType, template]);

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
  const overlaySrc =
    getDesignCompositeOverlayUrl({
      printMasterImage: template.printMasterImage,
      overlayImage: sideOverlay.overlayImage,
      overlaySvg: sideOverlay.overlaySvg,
    }) ??
    (sideOverlay.overlayImage
      ? resolveAssetUrl(sideOverlay.overlayImage)
      : sideOverlay.overlaySvg
        ? resolveAssetUrl(sideOverlay.overlaySvg)
        : null);

  const printAreaFitMaxScale = usePrintAreaMaxScale(
    frameRef,
    printBounds,
    overlaySrc ?? undefined,
    mockupLayout.overlayMaxScale,
  );
  const aspectMaxScale = useMemo(
    () => getAdminOverlayMaxScale(printAreaFitMaxScale),
    [printAreaFitMaxScale],
  );
  const editorPrintBounds = useMemo(
    () =>
      expandPrintAreaInsets(
        printBounds,
        ADMIN_OVERLAY_PRINT_AREA_BLEED_PERCENT,
      ),
    [printBounds],
  );

  const commitPlacement = useCallback(
    (next: PlacementValue) => {
      onPlacementChange(previewType, next);
    },
    [onPlacementChange, previewType],
  );

  const applyScale = useCallback(
    (nextScale: number) => {
      const clamped = clampPhotoScale(nextScale, aspectMaxScale);
      if (!containerRef.current?.parentElement) {
        commitPlacement({ scale: clamped, position: placement.position });
        return;
      }
      const reclamped = clampElementCenterToPrintArea(
        containerRef.current,
        containerRef.current.parentElement,
        editorPrintBounds,
        placement.position,
        { width: clamped, height: clamped },
      );
      commitPlacement({ scale: clamped, position: reclamped });
    },
    [aspectMaxScale, commitPlacement, editorPrintBounds, placement.position],
  );

  const fitToPrintArea = useCallback(() => {
    const scale = clampPhotoScale(printAreaFitMaxScale, printAreaFitMaxScale);
    const center = getPrintAreaCenter(printBounds);
    if (!containerRef.current?.parentElement) {
      commitPlacement({ scale, position: center });
      return;
    }
    const reclamped = clampElementCenterToPrintArea(
      containerRef.current,
      containerRef.current.parentElement,
      printBounds,
      center,
      { width: scale, height: scale },
    );
    commitPlacement({ scale, position: reclamped });
  }, [commitPlacement, printAreaFitMaxScale, printBounds]);

  const drag = useDraggableOverlayPosition(
    placement.position,
    (nextPosition) =>
      commitPlacement({ scale: placement.scale, position: nextPosition }),
    editorPrintBounds,
    containerRef,
  );

  const resize = useOverlayScaleResize(
    placement.scale,
    applyScale,
    PRODUCT_PHOTO_MIN_SCALE,
    aspectMaxScale,
  );

  const handlePos = useViewportClampedHandlePosition(containerRef, frameRef, [
    placement.scale,
    placement.position.x,
    placement.position.y,
    previewType,
    overlaySrc,
  ]);

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

  const isOversized = placement.scale > printAreaFitMaxScale;
  const sliderValue = Math.min(placement.scale, aspectMaxScale);

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

      <div className="mx-auto max-w-md space-y-3">
        <div ref={frameRef} className="relative">
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
              </div>
            </div>
          </ProductMockupFrame>

          {/* Viewport-clamped SE handle — stays reachable when overlay overflows */}
          {handlePos ? (
            <div
              role="button"
              tabIndex={0}
              aria-label="Resize overlay"
              className="absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-md"
              style={{
                left: handlePos.left,
                top: handlePos.top,
                touchAction: 'none',
              }}
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
          ) : null}
        </div>

        <div className="space-y-2 rounded-lg border border-ink-200 bg-ink-50/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-medium text-ink-700" htmlFor="overlay-scale-slider">
              Скала
              {isOversized ? (
                <span className="ml-1 font-normal text-amber-700">
                  (над print area — дозволено малку над зоната)
                </span>
              ) : null}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={PRODUCT_PHOTO_MIN_SCALE}
                max={aspectMaxScale}
                step={1}
                value={placement.scale}
                aria-label="Scale percent"
                onChange={(event) => {
                  const raw = Number(event.target.value);
                  if (!Number.isFinite(raw)) return;
                  applyScale(raw);
                }}
                className="w-16 rounded-md border border-ink-200 bg-white px-2 py-1 text-xs tabular-nums"
              />
              <span className="text-xs text-ink-500">%</span>
            </div>
          </div>

          <input
            id="overlay-scale-slider"
            type="range"
            min={PRODUCT_PHOTO_MIN_SCALE}
            max={aspectMaxScale}
            step={1}
            value={sliderValue}
            onChange={(event) => applyScale(Number(event.target.value))}
            className="w-full accent-brand-700"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fitToPrintArea}
              className="rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
            >
              Смести во print area
            </button>
            <button
              type="button"
              onClick={() => applyScale(DEFAULT_ADMIN_OVERLAY_SCALE)}
              className="rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
            >
              Reset scale
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
