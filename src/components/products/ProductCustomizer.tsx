'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import {
  capturePreviewElement,
  waitForPaint,
} from '@/lib/products/capture-preview';
import { capturePrintAreaDesign } from '@/lib/products/capture-print-area';
import {
  premadeSideSkipsPrintPngCapture,
  writePremadeArtworkSourceMetadata,
} from '@/lib/products/premade-artwork-source';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { sanitizeReturnTo } from '@/lib/products/paths';
import { resolveProductId } from '@/lib/products/product-id-aliases';
import {
  products,
  getProductMockup,
  getProductSides,
  type GarmentFit,
  type Product,
  type ProductDesignTemplate,
  type ProductSide,
  type ProductType,
} from '@/lib/data/catalog';
import {
  useMergedProductDesignTemplate,
  useMergedProductDesignTemplateQuery,
} from '@/lib/products/use-merged-product-design-template';
import { getDesignApplicableColors } from '@/lib/products/design-applicable-colors';
import {
  getDesignApplicableFits,
  getProductGarmentFit,
  resolveDesignProduct,
} from '@/lib/products/garment-fit';
import {
  getCompatibleDrinkwareProducts,
  getDrinkwareBodyColorOptions,
  isMugInsideProduct,
} from '@/lib/products/drinkware-product-options';
import { GarmentFitSelector } from '@/components/products/GarmentFitSelector';
import { DrinkwareProductSelector } from '@/components/products/DrinkwareProductSelector';
import { DesignColorPicker } from '@/components/products/DesignColorPicker';
import {
  evaluateCartAssetLimits,
  MAX_PHOTOS_PER_ORDER,
  MAX_STICKERS_PER_ORDER,
} from '@/lib/orders/order-assets';
import { useCart } from '@/components/cart/CartProvider';
import { useUploadSession } from '@/hooks/useUploadSession';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { cn, formatPrice } from '@/lib/utils';
import {
  formatProductCartName,
  restoreSideDesignFromMetadata,
} from '@/lib/cart/product-cart';
import {
  getOverlayPrintBounds,
  getMockupImageDisplayStyle,
  getProductMockupLayout,
  isCylindricalDrinkwareType,
} from '@/lib/products/product-mockup-layout';
import {
  DRINKWARE_FLAT_CANVAS_HEIGHT_PX,
  getDrinkware3DConfig,
  getDrinkwareFlatCanvasSize,
} from '@/lib/products/drinkware-3d-config';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DrinkwareDesignPreview3D } from '@/components/products/customizer/DrinkwareDesignPreview3D';
import { captureDrinkware3DPreviews } from '@/components/products/customizer/Drinkware3DCapture';
import {
  createSideDesignsForSides,
  getSideMetadataPrefix,
  isProductSide,
} from '@/lib/products/product-sides';
import {
  clearSideDesignArtwork,
  createDefaultSideDesign,
  sideDesignFromRestored,
  sideDesignsFromTemplate,
  type SideDesign,
  type UploadedFile,
} from '@/lib/products/design-state';
import { getInitialCustomizerSide } from '@/lib/products/design-sides';
import {
  copySideDesignToTarget,
  sideHasDesignContent,
} from '@/lib/products/side-design-copy';
import {
  PRODUCT_PHOTO_MIN_SCALE,
  PRODUCT_PRINT_AREA_MAX_SCALE,
  getCustomizerImageMaxScale,
  PRODUCT_CUSTOMIZER_DEFAULT_ZOOM,
  PRODUCT_CUSTOMIZER_DEFAULT_ZOOM_DRINKWARE,
} from '@/lib/products/customizer-constants';
import { clampPhotoScale } from '@/lib/products/crop-image';
import { ProductPhotoUpload } from '@/components/products/ProductPhotoUpload';
import { StickerPicker } from '@/components/products/StickerPicker';
import {
  createPlacedSticker,
  getStickerById,
  MAX_STICKERS_PER_SIDE,
  serializePlacedStickers,
  type PlacedSticker,
} from '@/lib/products/sticker-library';
import {
  MAX_PHOTOS_PER_SIDE,
  createPlacedPhoto,
  getPlacedPhotos,
  collectPlacedPhotoFileIds,
  serializePlacedPhotos,
  normalizeSideDesignPhotos,
  hydratePlacedPhotoPreviewUrls,
  sideHasPremadeOverlayArtwork,
  type PlacedPhoto,
} from '@/lib/products/photo-layers';
import {
  createPlacedTextLayer,
  MAX_TEXT_LAYERS_PER_SIDE,
  normalizeSideDesignText,
  sideHasTextContent,
  syncFlatTextFields,
  writeTextMetadata,
  getCustomizerFontFamily,
  type PlacedTextLayer,
} from '@/lib/products/text-layers';
import { TextLayerFontPicker } from '@/components/products/customizer/TextLayerFontPicker';
import type { CustomizerFontId } from '@/lib/products/customizer-fonts';
import {
  Shirt,
  Type,
  ImageIcon,
  Sparkles,
  ArrowLeft,
  Minus,
  Plus,
  AlignCenter,
  ArrowUp,
  ArrowDown,
  X,
  Save,
  Eye,
  Rotate3d,
  Undo2,
  Redo2,
  Check,
} from 'lucide-react';

import {
  inksHaveLowContrast,
  normalizeHex,
  suggestInkForShirt,
} from '@/lib/products/design-overlay';
import { resolveProductDesignDisplayName } from '@/lib/products/design-display-name';
import { useOverlayAssetUrl } from '@/hooks/useOverlayAssetUrl';
import { Palette } from 'lucide-react';
import type {
  EditorPanel,
  SelectedElement,
} from '@/components/products/customizer/types';
import { CustomizerShell } from '@/components/products/customizer/CustomizerShell';
import { CustomizerContextBar } from '@/components/products/customizer/CustomizerContextBar';
import { CustomizerSidesPreviewModal } from '@/components/products/customizer/CustomizerSidesPreviewModal';
import { PrintAreaGuideSwitch } from '@/components/products/customizer/PrintAreaGuideSwitch';
import { OutOfPrintAreaToast } from '@/components/products/customizer/OutOfPrintAreaToast';
import {
  CustomizerPrintAreaLayers,
} from '@/components/products/customizer/CustomizerPrintAreaLayers';
import { DrinkwareWrapHint } from '@/components/products/customizer/DrinkwarePrintAreaGuide';
import { DrinkwareSublimationPatchGuide } from '@/components/products/customizer/DrinkwareSublimationPatchGuide';
import {
  getDrinkwareBodyColor,
  getDrinkwareSublimationPatch,
  getSublimationPatchCssClipPath,
} from '@/lib/products/drinkware-sublimation-patch';
import { UnsavedWorkDialog } from '@/components/shared/UnsavedWorkDialog';
import { useDirtySnapshot } from '@/hooks/useDirtySnapshot';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useUndoRedoKeyboard } from '@/hooks/useUndoRedoKeyboard';
import { useUnsavedWorkGuard } from '@/hooks/useUnsavedWorkGuard';
import {
  serializeSideDesigns,
  upsertProductCustomizerDraft,
} from '@/lib/drafts/work-drafts';
import { dispatchDesignSaved } from '@/lib/drafts/draft-events';
import { findProductCustomizerDraft } from '@/lib/drafts/ongoing-designs';
import {
  getMaxTextSizeForPrintArea,
  getPrintAreaCenter,
  getPrintAreaMaxScale,
  getPrintAreaPositionPresets,
  getPrintAreaWidthPercent,
  isElementFullyOutsidePrintArea,
  measureContentLayersBoundsPercent,
  type PrintAreaInsets,
} from '@/lib/products/print-area';
import { notifyMovedOutsidePrintArea } from '@/lib/products/print-area-events';
import {
  deriveTshirtPrintPackage,
  getTshirtPrintAreaInsets,
  getTshirtUnitPrice,
  isTshirtProduct,
  type TshirtPrintPackage,
} from '@/lib/products/tshirt-print-pricing';
import { usePrintAreaMaxScale } from '@/lib/products/use-print-area-max-scale';

/**
 * If an element's bounding box has no overlap left with the print area,
 * snap its center back to the print area center and let the user know.
 * Called only at drag-end / resize-end — never mid-gesture — so users can
 * freely move layers partially (or fully, temporarily) outside the dashed
 * print box while dragging.
 */
function recenterIfFullyOutsidePrintArea({
  element,
  parent,
  printBounds,
  position,
  onPositionChange,
}: {
  element: HTMLElement | null;
  parent: HTMLElement | null;
  printBounds?: PrintAreaInsets;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
}) {
  if (!printBounds) return;
  if (!isElementFullyOutsidePrintArea(element, parent, printBounds, position)) {
    return;
  }
  onPositionChange(getPrintAreaCenter(printBounds));
  notifyMovedOutsidePrintArea();
}

type RecenterIfOutsideArgs = Parameters<typeof recenterIfFullyOutsidePrintArea>[0];

/**
 * Defer the outside-print-area check until after React has committed the
 * drag/resize position and the browser has laid out the overlay. A synchronous
 * check on pointer-up often false-negatives (toast + recenter only appear
 * after a side switch re-layout).
 */
function scheduleRecenterIfFullyOutsidePrintArea(
  getArgs: () => RecenterIfOutsideArgs,
) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      recenterIfFullyOutsidePrintArea(getArgs());
    });
  });
}

type OverlayGestureHandlers = {
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
};

/**
 * While the user drags or resizes a flat overlay, keep the live 3D wrap texture
 * on the last committed layout so `buildDrinkwareWrapTexture` is not rebuilt
 * every pointermove. The 2D canvas still reads live design state.
 */
function useDrinkware3DPreviewFreeze(
  sideDesign: SideDesign,
  enabled: boolean,
) {
  const gestureCountRef = useRef(0);
  const frozenRef = useRef<{
    textLayers: PlacedTextLayer[];
    sideDesign: SideDesign;
  } | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);

  const beginOverlayGesture = useCallback(() => {
    if (!enabled) return;
    if (gestureCountRef.current === 0) {
      frozenRef.current = {
        textLayers: sideDesign.textLayers,
        sideDesign,
      };
      setIsFrozen(true);
    }
    gestureCountRef.current += 1;
  }, [enabled, sideDesign]);

  const endOverlayGesture = useCallback(() => {
    if (!enabled) return;
    gestureCountRef.current = Math.max(0, gestureCountRef.current - 1);
    if (gestureCountRef.current === 0) {
      setIsFrozen(false);
      frozenRef.current = null;
    }
  }, [enabled]);

  const preview3DTextLayers =
    isFrozen && frozenRef.current
      ? frozenRef.current.textLayers
      : sideDesign.textLayers;

  const preview3DSideDesign =
    isFrozen && frozenRef.current ? frozenRef.current.sideDesign : sideDesign;

  return {
    preview3DTextLayers,
    preview3DSideDesign,
    beginOverlayGesture,
    endOverlayGesture,
  };
}

function useDraggablePosition(
  position: { x: number; y: number },
  onChange: (pos: { x: number; y: number }) => void,
  printBounds?: PrintAreaInsets,
  measureRef?: RefObject<HTMLElement | null>,
  gestureHandlers?: OverlayGestureHandlers,
) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(position);
  const dragOriginRef = useRef(position);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const movedDuringDragRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const gestureHandlersRef = useRef(gestureHandlers);
  const printBoundsRef = useRef(printBounds);
  const measureRefRef = useRef(measureRef);

  onChangeRef.current = onChange;
  gestureHandlersRef.current = gestureHandlers;
  printBoundsRef.current = printBounds;
  measureRefRef.current = measureRef;

  // Commit design state only on pointer-up. While dragging, keep the live
  // position in a ref + DOM styles so footprint / print-package effects do
  // not re-run on every pointermove frame.
  if (!draggingRef.current) {
    positionRef.current = position;
  }

  const applyVisualPosition = (pos: { x: number; y: number }) => {
    const el = elementRef.current;
    if (!el) return;
    el.style.left = `${pos.x}%`;
    el.style.top = `${pos.y}%`;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    movedDuringDragRef.current = false;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    dragOriginRef.current = position;
    positionRef.current = position;
    const el = elementRef.current;
    if (el) {
      applyVisualPosition(position);
    }
    gestureHandlersRef.current?.onGestureStart?.();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !dragStartRef.current) return;
    event.preventDefault();
    movedDuringDragRef.current = true;
    const deltaX = event.clientX - dragStartRef.current.x;
    const deltaY = event.clientY - dragStartRef.current.y;
    dragStartRef.current = { x: event.clientX, y: event.clientY };

    const parent = elementRef.current?.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const currentX = (positionRef.current.x / 100) * parentRect.width;
    const currentY = (positionRef.current.y / 100) * parentRect.height;
    const nextX = Math.min(Math.max(currentX + deltaX, 0), parentRect.width);
    const nextY = Math.min(Math.max(currentY + deltaY, 0), parentRect.height);
    const next = {
      x: (nextX / parentRect.width) * 100,
      y: (nextY / parentRect.height) * 100,
    };
    positionRef.current = next;
    applyVisualPosition(next);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      draggingRef.current = false;
      dragStartRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const finalPos = positionRef.current;
      const origin = dragOriginRef.current;
      if (finalPos.x !== origin.x || finalPos.y !== origin.y) {
        onChangeRef.current(finalPos);
      }
      movedDuringDragRef.current = false;
      scheduleRecenterIfFullyOutsidePrintArea(() => ({
        element: measureRefRef.current?.current ?? elementRef.current,
        parent: elementRef.current?.parentElement ?? null,
        printBounds: printBoundsRef.current,
        position: finalPos,
        onPositionChange: onChangeRef.current,
      }));
      gestureHandlersRef.current?.onGestureEnd?.();
    }
  };

  return {
    ref: elementRef,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}

function useScaleResize(
  scale: number,
  onScaleChange: (scale: number) => void,
  min = 15,
  max = 120,
  onResizeEnd?: () => void,
  gestureHandlers?: OverlayGestureHandlers,
) {
  const draggingRef = useRef(false);
  const startRef = useRef({ pointerX: 0, pointerY: 0, scale: 0 });
  const previewScaleRef = useRef<number | null>(null);
  const [previewScale, setPreviewScale] = useState<number | null>(null);
  const onScaleChangeRef = useRef(onScaleChange);
  const maxRef = useRef(max);
  maxRef.current = max;
  const minRef = useRef(min);
  minRef.current = min;

  onScaleChangeRef.current = onScaleChange;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    startRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      scale,
    };
    previewScaleRef.current = null;
    setPreviewScale(null);
    gestureHandlers?.onGestureStart?.();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    const delta =
      event.clientX - startRef.current.pointerX +
      (event.clientY - startRef.current.pointerY);
    // Guard against an inverted range (effective min above max), which
    // would otherwise pin `next` to a single overflowing value and make
    // the resize handle appear frozen for very tall/narrow artwork.
    const effectiveMin = Math.min(minRef.current, maxRef.current);
    const next = Math.min(
      maxRef.current,
      Math.max(effectiveMin, Math.round(startRef.current.scale + delta * 0.15)),
    );
    previewScaleRef.current = next;
    setPreviewScale(next);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      draggingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      const finalScale = previewScaleRef.current;
      previewScaleRef.current = null;
      setPreviewScale(null);
      if (finalScale !== null && finalScale !== scale) {
        onScaleChangeRef.current(finalScale);
      }
      onResizeEnd?.();
      gestureHandlers?.onGestureEnd?.();
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    displayScale: previewScale ?? scale,
  };
}

function OverlayRemoveButton({
  onRemove,
  label,
  hidden,
  placement = 'image',
}: {
  onRemove: () => void;
  label: string;
  hidden?: boolean;
  placement?: 'image' | 'text';
}) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onRemove();
      }}
      className={
        placement === 'text'
          ? // Sit just outside the text box’s top-right edge.
            'absolute -top-2 left-[calc(100%+0.375rem)] z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ink-900/90 text-white shadow-md transition hover:bg-ink-900'
          : // Anchor to the design’s top-right corner; translate so the
            // button center sits on the corner and most of it stays outside
            // the artwork instead of covering it.
            'absolute right-0 top-0 z-10 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-ink-900/90 text-white shadow-md transition hover:bg-ink-900'
      }
      aria-label={label}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

function ResizableDesignOverlay({
  design,
  template,
  shirtColor,
  scale,
  position,
  onScaleChange,
  onPositionChange,
  onRemove,
  removeLabel,
  hideControls,
  maxScale,
  printBounds,
  selected,
  onSelect,
  overlayGestureHandlers,
}: {
  design: SideDesign;
  template: ProductDesignTemplate | null | undefined;
  shirtColor: string;
  scale: number;
  position: { x: number; y: number };
  onScaleChange: (scale: number) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onRemove?: () => void;
  removeLabel?: string;
  hideControls?: boolean;
  maxScale?: number;
  printBounds?: PrintAreaInsets;
  selected?: boolean;
  onSelect?: () => void;
  overlayGestureHandlers?: OverlayGestureHandlers;
}) {
  const src = useOverlayAssetUrl({ design, template, shirtColor });
  if (!src) return null;

  return (
    <ResizableImageOverlay
      src={src}
      alt="design"
      scale={scale}
      position={position}
      onScaleChange={onScaleChange}
      onPositionChange={onPositionChange}
      onRemove={onRemove}
      removeLabel={removeLabel}
      hideControls={hideControls}
      maxScale={maxScale}
      printBounds={printBounds}
      selected={selected}
      onSelect={onSelect}
      overlayGestureHandlers={overlayGestureHandlers}
    />
  );
}

function ResizableImageOverlay({
  src,
  alt,
  scale,
  position,
  onScaleChange,
  onPositionChange,
  onRemove,
  removeLabel,
  hideControls,
  maxScale,
  printBounds,
  selected,
  onSelect,
  overlayGestureHandlers,
}: {
  src: string;
  alt: string;
  scale: number;
  position: { x: number; y: number };
  onScaleChange: (scale: number) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onRemove?: () => void;
  removeLabel?: string;
  hideControls?: boolean;
  maxScale?: number;
  printBounds?: PrintAreaInsets;
  selected?: boolean;
  onSelect?: () => void;
  overlayGestureHandlers?: OverlayGestureHandlers;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(position);
  const onPositionChangeRef = useRef(onPositionChange);

  positionRef.current = position;
  onPositionChangeRef.current = onPositionChange;

  const scheduleRecenter = useCallback(() => {
    scheduleRecenterIfFullyOutsidePrintArea(() => ({
      element: containerRef.current,
      parent: containerRef.current?.parentElement ?? null,
      printBounds,
      position: positionRef.current,
      onPositionChange: onPositionChangeRef.current,
    }));
  }, [printBounds]);

  useLayoutEffect(() => {
    if (!printBounds) return;
    scheduleRecenter();
  }, [printBounds, scheduleRecenter]);

  const drag = useDraggablePosition(
    position,
    onPositionChange,
    printBounds,
    undefined,
    overlayGestureHandlers,
  );
  const resize = useScaleResize(
    scale,
    (next) => onScaleChange(clampPhotoScale(next, maxScale)),
    PRODUCT_PHOTO_MIN_SCALE,
    maxScale ?? PRODUCT_PRINT_AREA_MAX_SCALE,
    scheduleRecenter,
    overlayGestureHandlers,
  );
  const displayScale = hideControls ? scale : resize.displayScale;
  const showChrome = selected && !hideControls;

  const positionStyle = {
    left: `${position.x}%`,
    top: `${position.y}%`,
    width: `${displayScale}%`,
    transform: 'translate(-50%, -50%)',
  } as const;

  const controls = (
    <>
      {onRemove && removeLabel ? (
        <OverlayRemoveButton
          onRemove={onRemove}
          label={removeLabel}
          hidden={!showChrome}
        />
      ) : null}
      <div
        role="button"
        tabIndex={0}
        aria-label="Resize"
        className="absolute -bottom-2 -right-2 z-20 flex h-6 w-6 cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-md"
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
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        drag.ref.current = node;
      }}
      className={cn(
        'absolute',
        hideControls
          ? 'pointer-events-none'
          : 'cursor-grab active:cursor-grabbing pointer-events-auto',
      )}
      data-customizer-selected-layer={showChrome ? '' : undefined}
      data-customizer-content-layer=""
      style={{
        ...positionStyle,
        touchAction: hideControls ? 'auto' : 'none',
      }}
      {...(hideControls
        ? {}
        : {
            onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
              event.stopPropagation();
              onSelect?.();
              drag.onPointerDown(event);
            },
            onPointerMove: drag.onPointerMove,
            onPointerUp: drag.onPointerUp,
            onPointerCancel: drag.onPointerCancel,
          })}
    >
      <div
        className={cn(
          'relative rounded-lg',
          showChrome && 'ring-2 ring-brand-500 ring-offset-2',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            crossOrigin="anonymous"
            className="pointer-events-none block w-full rounded-lg object-contain shadow-sm"
          />
        {showChrome ? controls : null}
      </div>
    </div>
  );
}

function ResizableStickerOverlay({
  sticker,
  onScaleChange,
  onPositionChange,
  onRemove,
  removeLabel,
  hideControls,
  printBounds,
  selected,
  onSelect,
  overlayGestureHandlers,
}: {
  sticker: PlacedSticker;
  onScaleChange: (scale: number) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onRemove?: () => void;
  removeLabel?: string;
  hideControls?: boolean;
  printBounds?: PrintAreaInsets;
  selected?: boolean;
  onSelect?: () => void;
  overlayGestureHandlers?: OverlayGestureHandlers;
}) {
  const definition = getStickerById(sticker.stickerId);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(sticker.position);
  const onPositionChangeRef = useRef(onPositionChange);

  positionRef.current = sticker.position;
  onPositionChangeRef.current = onPositionChange;

  const scheduleRecenter = useCallback(() => {
    scheduleRecenterIfFullyOutsidePrintArea(() => ({
      element: containerRef.current,
      parent: containerRef.current?.parentElement ?? null,
      printBounds,
      position: positionRef.current,
      onPositionChange: onPositionChangeRef.current,
    }));
  }, [printBounds]);

  useLayoutEffect(() => {
    if (!printBounds) return;
    scheduleRecenter();
  }, [printBounds, scheduleRecenter]);

  const drag = useDraggablePosition(
    sticker.position,
    onPositionChange,
    printBounds,
    undefined,
    overlayGestureHandlers,
  );
  const resize = useScaleResize(
    sticker.scale,
    (next) => onScaleChange(Math.min(52, Math.max(12, Math.round(next)))),
    12,
    52,
    scheduleRecenter,
    overlayGestureHandlers,
  );
  const displayScale = hideControls ? sticker.scale : resize.displayScale;
  const showChrome = selected && !hideControls;

  if (!definition) return null;

  const positionStyle = {
    left: `${sticker.position.x}%`,
    top: `${sticker.position.y}%`,
    width: `${displayScale}%`,
    transform: 'translate(-50%, -50%)',
  } as const;

  const controls = (
    <>
      {onRemove && removeLabel ? (
        <OverlayRemoveButton
          onRemove={onRemove}
          label={removeLabel}
          hidden={!showChrome}
        />
      ) : null}
      <div
        role="button"
        tabIndex={0}
        aria-label="Resize sticker"
        className="absolute -bottom-2 -right-2 z-20 flex h-6 w-6 cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-md"
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
            strokeLinecap="round"
          />
        </svg>
      </div>
    </>
  );

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        drag.ref.current = node;
      }}
      className={cn(
        'absolute',
        hideControls
          ? 'pointer-events-none select-none'
          : 'cursor-grab select-none active:cursor-grabbing pointer-events-auto',
      )}
      data-customizer-selected-layer={showChrome ? '' : undefined}
      data-customizer-content-layer=""
      style={{
        ...positionStyle,
        touchAction: hideControls ? 'auto' : 'none',
      }}
      {...(hideControls
        ? {}
        : {
            onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
              event.stopPropagation();
              onSelect?.();
              drag.onPointerDown(event);
            },
            onPointerMove: drag.onPointerMove,
            onPointerUp: drag.onPointerUp,
            onPointerCancel: drag.onPointerCancel,
          })}
    >
      <div
        className={cn(
          'relative rounded-lg',
          showChrome && 'ring-2 ring-brand-500 ring-offset-2',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={definition.src}
            alt=""
            draggable={false}
            crossOrigin="anonymous"
            className="pointer-events-none block w-full object-contain drop-shadow-md"
          />
        {showChrome ? controls : null}
      </div>
    </div>
  );
}

export function ProductCustomizer({ type }: { type: ProductType }) {
  const t = useTranslations('products.customizer');
  const tp = useTranslations('products.types');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem, updateItem, items: cartItems } = useCart();
  const { token, loading: uploadLoading, error: uploadError, refreshSession } = useUploadSession();
  const isDrinkware = isCylindricalDrinkwareType(type);
  const isDesktopSplitPreview = useMediaQuery('(min-width: 1280px)') && isDrinkware;
  const isLargeCustomizerViewport = useMediaQuery('(min-width: 1024px)');

  const productId = searchParams.get('id');
  /** Immediate drinkware SKU while router.replace flushes ?id= to searchParams. */
  const [pendingDrinkwareProductId, setPendingDrinkwareProductId] = useState<
    string | null
  >(null);

  useEffect(() => {
    setPendingDrinkwareProductId(null);
  }, [productId]);

  const activeProductId = pendingDrinkwareProductId ?? productId ?? undefined;
  const designId = searchParams.get('design');
  const editCartItemId = searchParams.get('edit');
  const colorParam = searchParams.get('color');
  const sizeParam = searchParams.get('size');
  const fitParam = searchParams.get('fit');
  // Only restore a previously saved draft when the link explicitly asks for
  // it (e.g. the pencil icon in "ongoing designs"). Plain "create design"
  // entry points should always start a blank session.
  const resumeParam = searchParams.get('resume') === '1';
  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'));

  const designTemplateForFit = useMergedProductDesignTemplate(designId);

  const product = useMemo(
    () => {
      const resolvedId = activeProductId
        ? resolveProductId(activeProductId)
        : undefined;
      const base =
        products.find((p) => p.id === resolvedId) ||
        products.find((p) => p.type === type);
      if (!base || base.type !== 't-shirt' || !designTemplateForFit) {
        return base;
      }

      const fits = getDesignApplicableFits(designTemplateForFit);
      if (fits.length === 0) return base;

      const resolvedFit =
        fitParam && fits.includes(fitParam as GarmentFit)
          ? (fitParam as GarmentFit)
          : fits[0];

      return resolveDesignProduct(designTemplateForFit, resolvedFit);
    },
    [activeProductId, type, designTemplateForFit, fitParam],
  );

  const leaveHref =
    returnTo ?? `/products/${product?.id ?? productId ?? ''}`;

  const garmentFits = designTemplateForFit
    ? getDesignApplicableFits(designTemplateForFit)
    : [];
  const garmentFit: GarmentFit = product
    ? (getProductGarmentFit(product) ?? 'unisex')
    : 'unisex';

  const selectableColors = useMemo(() => {
    if (!product?.colors) return [];
    if (!designTemplateForFit) return product.colors;
    return getDesignApplicableColors(designTemplateForFit, product);
  }, [product, designTemplateForFit]);

  const compatibleDrinkwareProducts = useMemo(() => {
    if (!isDrinkware) return [];
    return getCompatibleDrinkwareProducts(designTemplateForFit);
  }, [designTemplateForFit, isDrinkware]);

  const drinkwareBodyColors = useMemo(() => {
    if (!isDrinkware || !product) return [];
    return getDrinkwareBodyColorOptions(product);
  }, [isDrinkware, product]);

  const [color, setColor] = useState(() => {
    const palette = product?.colors ?? [];
    const fromParam = colorParam
      ? palette.find((c) => normalizeHex(c) === normalizeHex(colorParam))
      : undefined;
    return fromParam ?? palette[0] ?? '#c5ccd6';
  });
  const [size, setSize] = useState(() => {
    const sizes = product?.sizes ?? [];
    return sizeParam && sizes.includes(sizeParam) ? sizeParam : (sizes[0] ?? '');
  });

  const handleDrinkwareProductChange = useCallback(
    (nextProductId: string) => {
      if (nextProductId === activeProductId) return;
      const nextProduct = products.find(
        (p) => p.id === resolveProductId(nextProductId),
      );
      if (!nextProduct) return;

      setPendingDrinkwareProductId(nextProductId);

      const nextColors = designTemplateForFit
        ? getDesignApplicableColors(designTemplateForFit, nextProduct)
        : getDrinkwareBodyColorOptions(nextProduct);

      const params = new URLSearchParams(searchParams.toString());
      params.set('id', nextProduct.id);

      const resolvedColor = nextColors.includes(color)
        ? color
        : (nextColors[0] ?? nextProduct.colors?.[0]);
      if (resolvedColor) {
        params.set('color', resolvedColor);
        setColor(resolvedColor);
      }

      if (nextProduct.sizes?.length) {
        const resolvedSize = nextProduct.sizes.includes(size)
          ? size
          : nextProduct.sizes[0];
        params.set('size', resolvedSize);
        setSize(resolvedSize);
      } else {
        params.delete('size');
      }

      router.replace(
        `/products/customize/${nextProduct.type}?${params.toString()}`,
      );
    },
    [
      activeProductId,
      color,
      designTemplateForFit,
      router,
      searchParams,
      size,
    ],
  );

  const handleColorChange = useCallback(
    (nextColor: string) => {
      setColor(nextColor);
      if (!isDrinkware || !product) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('color', nextColor);
      if (product.id) params.set('id', product.id);
      router.replace(`/products/customize/${type}?${params.toString()}`, {
        scroll: false,
      });
    },
    [isDrinkware, product, router, searchParams, type],
  );

  useEffect(() => {
    if (!isDrinkware || !product?.colors?.length) return;
    const palette = getDrinkwareBodyColorOptions(product);
    if (
      palette.length > 0 &&
      !palette.some((value) => normalizeHex(value) === normalizeHex(color))
    ) {
      setColor(palette[0]!);
    }
  }, [color, isDrinkware, product]);

  const handleGarmentFitChange = useCallback(
    (nextFit: GarmentFit) => {
      if (!designTemplateForFit || !product) return;
      const nextProduct = resolveDesignProduct(designTemplateForFit, nextFit);
      const nextColors = getDesignApplicableColors(
        designTemplateForFit,
        nextProduct,
      );
      const params = new URLSearchParams(searchParams.toString());
      params.set('id', nextProduct.id);
      params.set('fit', nextFit);
      if (nextColors.length > 0 && !nextColors.includes(color)) {
        params.set('color', nextColors[0]);
        setColor(nextColors[0]);
      }
      if (nextProduct.sizes?.length) {
        params.set('size', nextProduct.sizes[0]);
        setSize(nextProduct.sizes[0]);
      }
      router.replace(`/products/customize/${type}?${params.toString()}`);
    },
    [color, designTemplateForFit, product, router, searchParams, type],
  );

  const isTshirt = product ? isTshirtProduct(product) : false;

  // T-shirts always expose every configured side (front + back) for
  // editing — same as hoodies/other multi-side garments. There is no
  // package picker: placement + price are derived from footprints below.
  const sides = useMemo(() => {
    if (!product) return ['front' as ProductSide];
    return getProductSides(product);
  }, [product]);
  const hasMultipleSides = sides.length > 1;
  const sideLabel = useCallback(
    (side: ProductSide) => {
      if (side === 'front') return t('front');
      if (side === 'back') return t('back');
      if (side === 'left') return t('left');
      return t('right');
    },
    [t],
  );

  const [quantity, setQuantity] = useState(1);
  const [activeSide, setActiveSide] = useState<ProductSide>('front');
  const sideDesignsHistoryEqual = useCallback(
    (
      left: Record<ProductSide, SideDesign>,
      right: Record<ProductSide, SideDesign>,
    ) =>
      JSON.stringify(serializeSideDesigns(left)) ===
      JSON.stringify(serializeSideDesigns(right)),
    [],
  );
  const {
    present: sideDesigns,
    set: setSideDesigns,
    replace: replaceSideDesigns,
    undo: undoSideDesigns,
    redo: redoSideDesigns,
    reset: resetSideDesigns,
    canUndo,
    canRedo,
  } = useUndoRedo(
    () => createSideDesignsForSides(sides),
    { isEqual: sideDesignsHistoryEqual },
  );
  const [activePanel, setActivePanel] = useState<EditorPanel>('product');
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  /** Last text layer edited in the panel — survives canvas deselect when opening tabs. */
  const [editingTextLayerId, setEditingTextLayerId] = useState<string | null>(
    null,
  );
  const contextBarRef = useRef<HTMLDivElement>(null);

  const handleSelectElement = useCallback((element: SelectedElement) => {
    setSelectedElement(element);
    if (element?.startsWith('text:')) {
      setEditingTextLayerId(element.slice('text:'.length));
    }
  }, []);
  const [canvasZoom, setCanvasZoom] = useState(
    () =>
      isDrinkware
        ? PRODUCT_CUSTOMIZER_DEFAULT_ZOOM_DRINKWARE
        : PRODUCT_CUSTOMIZER_DEFAULT_ZOOM,
  );
  const [sidesPreviewOpen, setSidesPreviewOpen] = useState(false);
  const [editorMockupInnerHeight, setEditorMockupInnerHeight] = useState<
    number | undefined
  >(undefined);

  const previewRef = useRef<HTMLDivElement | null>(null);

  // Measured on-canvas footprint (% of the mockup) of the currently active
  // side's design layers — cached per side so switching tabs doesn't lose
  // the last measurement of the side you're not currently looking at.
  const [sideFootprints, setSideFootprints] = useState<
    Partial<Record<ProductSide, { width: number; height: number }>>
  >({});
  /** Fixed unwrap height — parent CSS zoom must not affect 2D↔3D text mapping. */
  const drinkwareCanvasHeightPx = DRINKWARE_FLAT_CANVAS_HEIGHT_PX;
  const designInitializedRef = useRef<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cartLimitError, setCartLimitError] = useState<
    'stickers' | 'photos' | null
  >(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );

  const serializedDraft = useMemo(
    () =>
      JSON.stringify({
        color,
        size,
        quantity,
        activeSide,
        sideDesigns: serializeSideDesigns(sideDesigns),
      }),
    [color, size, quantity, activeSide, sideDesigns],
  );
  const [baselineReady, setBaselineReady] = useState(false);

  useEffect(() => {
    if (!product) return;
    const timer = window.setTimeout(() => setBaselineReady(true), 500);
    return () => window.clearTimeout(timer);
  }, [product?.id, designId, editCartItemId, product]);

  const { isDirty, markClean } = useDirtySnapshot(serializedDraft, baselineReady);

  useUndoRedoKeyboard({
    undo: undoSideDesigns,
    redo: redoSideDesigns,
    canUndo,
    canRedo,
    enabled: baselineReady,
  });

  useEffect(() => {
    if (!selectedElement) return;

    const design = sideDesigns[activeSide] ?? createDefaultSideDesign();
    let stillSelected = true;

    if (selectedElement.startsWith('text:')) {
      const instanceId = selectedElement.slice('text:'.length);
      stillSelected = design.textLayers.some(
        (layer) => layer.instanceId === instanceId,
      );
    } else if (selectedElement.startsWith('sticker:')) {
      const instanceId = selectedElement.slice('sticker:'.length);
      stillSelected = design.stickers.some(
        (sticker) => sticker.instanceId === instanceId,
      );
    } else if (selectedElement.startsWith('photo:')) {
      const instanceId = selectedElement.slice('photo:'.length);
      stillSelected = getPlacedPhotos(design).some(
        (photo) => photo.instanceId === instanceId,
      );
    } else if (selectedElement === 'overlay') {
      stillSelected = Boolean(
        design.premadeDesignId ||
          design.overlayRaster ||
          design.overlaySvg ||
          design.isRecolorableOverlay,
      );
    }

    if (!stillSelected) {
      setSelectedElement(null);
    }
  }, [activeSide, selectedElement, sideDesigns]);

  useEffect(() => {
    if (!selectedElement) return;

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (contextBarRef.current?.contains(target)) return;

      if (
        target instanceof Element &&
        target.closest('[data-customizer-editor-chrome]')
      ) {
        return;
      }

      const selectedLayer = document.querySelector(
        '[data-customizer-selected-layer]',
      );
      if (selectedLayer?.contains(target)) return;

      setSelectedElement(null);
    };

    document.addEventListener('pointerdown', handlePointerDown, {
      capture: true,
    });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      });
    };
  }, [selectedElement]);

  const saveDraft = useCallback(async () => {
    if (!product) return false;

    try {
      upsertProductCustomizerDraft({
        id: `product-${product.id}-${designId ?? 'blank'}`,
        name: t('savedDraftName', { product: tp(type) }),
        productId: product.id,
        productType: type,
        designId,
        color,
        size,
        quantity,
        activeSide,
        sideDesigns: serializeSideDesigns(sideDesigns),
        updatedAt: new Date().toISOString(),
      });
      markClean();
      return true;
    } catch {
      return false;
    }
  }, [
    activeSide,
    color,
    designId,
    markClean,
    product,
    quantity,
    sideDesigns,
    size,
    t,
    tp,
    type,
  ]);

  const unsavedWorkGuard = useUnsavedWorkGuard({
    isDirty,
    onSave: saveDraft,
  });

  const handleSaveDesign = useCallback(async () => {
    setSaveState('saving');
    try {
      const saved = await saveDraft();
      if (!saved) {
        setSaveState('idle');
        return;
      }
      dispatchDesignSaved();
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('idle');
    }
  }, [saveDraft]);

  const currentDesign = useMemo(() => {
    const normalized = normalizeSideDesignText(
      normalizeSideDesignPhotos(
        sideDesigns[activeSide] ?? createDefaultSideDesign(),
      ),
    );
    const photos = normalized.uploadedPhotos;
    if (
      photos.length === 0 ||
      photos.every((photo) => photo.previewUrl || !photo.fileId?.trim())
    ) {
      return normalized;
    }
    return {
      ...normalized,
      uploadedPhotos: hydratePlacedPhotoPreviewUrls(photos, token),
    };
  }, [sideDesigns, activeSide, token]);

  const activeDesignTemplateId = designId ?? currentDesign.premadeDesignId ?? null;
  const {
    template: activeDesignTemplate,
    isResolved: designTemplateResolved,
  } = useMergedProductDesignTemplateQuery(activeDesignTemplateId);

  const overlayAssetUrl = useOverlayAssetUrl({
    design: currentDesign,
    template: activeDesignTemplate,
    shirtColor: color,
  });

  // Track editor mockup inner height for compact side previews (text scales with mockup).
  useLayoutEffect(() => {
    if (isDrinkware) return;
    const container = previewRef.current;
    if (!container) return;

    const mockupInner = container.querySelector<HTMLElement>('[data-mockup-inner]');
    if (!mockupInner) return;

    const update = () => {
      setEditorMockupInnerHeight(mockupInner.offsetHeight || undefined);
    };
    update();

    const observer = new ResizeObserver(update);
    observer.observe(mockupInner);
    observer.observe(container);
    return () => observer.disconnect();
  }, [
    activeSide,
    color,
    type,
    product?.id,
    canvasZoom,
    isDrinkware,
    isLargeCustomizerViewport,
  ]);

  function openSidesPreview() {
    const inner = previewRef.current?.querySelector<HTMLElement>('[data-mockup-inner]');
    setEditorMockupInnerHeight(inner?.offsetHeight ?? undefined);
    setSidesPreviewOpen(true);
  }

  // Re-measure the active side's on-canvas footprint whenever its geometry
  // (position/scale/text/stickers) changes — drives the auto-derived print
  // package below instead of a user-facing placement picker.
  useLayoutEffect(() => {
    if (!isTshirt) return;
    const mockupInner = previewRef.current?.querySelector<HTMLElement>(
      '[data-mockup-inner]',
    );
    const measured = measureContentLayersBoundsPercent(mockupInner ?? null);

    setSideFootprints((prev) => {
      const existing = prev[activeSide];
      if (!existing && !measured) return prev;
      if (
        existing &&
        measured &&
        Math.abs(existing.width - measured.width) < 0.5 &&
        Math.abs(existing.height - measured.height) < 0.5
      ) {
        return prev;
      }
      const next = { ...prev };
      if (measured) {
        next[activeSide] = measured;
      } else {
        delete next[activeSide];
      }
      return next;
    });
  }, [isTshirt, activeSide, currentDesign]);

  const frontHasContent = sideHasDesignContent(sideDesigns.front);
  const backHasContent = sideHasDesignContent(sideDesigns.back);

  // Auto-derived print package: each side with content is classified
  // small vs large from its measured footprint (dual → four price tiers).
  const printPackage = useMemo<TshirtPrintPackage>(() => {
    if (!isTshirt) return 'front-large';
    return deriveTshirtPrintPackage({
      hasFrontContent: frontHasContent,
      hasBackContent: backHasContent,
      frontFootprint: sideFootprints.front ?? null,
      backFootprint: sideFootprints.back ?? null,
      isWomen: product?.fit === 'women',
    });
  }, [
    isTshirt,
    frontHasContent,
    backHasContent,
    sideFootprints.front,
    sideFootprints.back,
    product,
  ]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    if (isTshirtProduct(product)) return getTshirtUnitPrice(printPackage);
    return product.basePrice;
  }, [product, printPackage]);

  // Editing always uses the generous chest zone — the tighter "small
  // print" zone (see tshirt-print-pricing.ts) only classifies price/back
  // placement after the fact and never restricts where users can drag.
  const effectivePrintAreaInsets = useMemo((): PrintAreaInsets => {
    if (!product) {
      return { top: 12, right: 12, bottom: 12, left: 12 };
    }
    if (isTshirtProduct(product)) {
      return getTshirtPrintAreaInsets('front-large', activeSide, product);
    }
    return getProductMockupLayout(product).printArea;
  }, [product, activeSide]);

  const mockupLayout = useMemo(() => {
    if (!product) return null;
    const base = getProductMockupLayout(product);
    if (!isTshirtProduct(product)) return base;
    const insets = getTshirtPrintAreaInsets('front-large', activeSide, product);
    return {
      ...base,
      printArea: insets,
      overlayMaxScale: getPrintAreaMaxScale(insets),
    };
  }, [product, activeSide]);
  const overlayPrintBounds = mockupLayout
    ? getOverlayPrintBounds(mockupLayout)
    : undefined;

  const hasScalableOverlay = Boolean(
    currentDesign.overlaySvg || currentDesign.overlayColorVariants,
  );

  const scalableImageUrl =
    getPlacedPhotos(currentDesign)[0]?.previewUrl ??
    (hasScalableOverlay && overlayAssetUrl ? overlayAssetUrl : undefined);

  const printAreaFitMaxScale = usePrintAreaMaxScale(
    previewRef,
    overlayPrintBounds,
    scalableImageUrl,
    mockupLayout?.overlayMaxScale ?? PRODUCT_PRINT_AREA_MAX_SCALE,
  );
  const imageMaxScale = useMemo(
    () => getCustomizerImageMaxScale(printAreaFitMaxScale),
    [printAreaFitMaxScale],
  );

  const activeTextLayerId = useMemo(() => {
    if (selectedElement?.startsWith('text:')) {
      return selectedElement.replace('text:', '');
    }
    if (
      editingTextLayerId &&
      currentDesign.textLayers.some(
        (layer) => layer.instanceId === editingTextLayerId,
      )
    ) {
      return editingTextLayerId;
    }
    return currentDesign.textLayers[0]?.instanceId ?? null;
  }, [selectedElement, editingTextLayerId, currentDesign.textLayers]);

  const {
    preview3DTextLayers,
    preview3DSideDesign,
    beginOverlayGesture,
    endOverlayGesture,
  } = useDrinkware3DPreviewFreeze(currentDesign, isDrinkware);

  const overlayGestureHandlers = useMemo(
    (): OverlayGestureHandlers => ({
      onGestureStart: beginOverlayGesture,
      onGestureEnd: endOverlayGesture,
    }),
    [beginOverlayGesture, endOverlayGesture],
  );

  const updateCurrentSide = useCallback(
    (
      updates: Partial<SideDesign>,
      options?: {
        record?: boolean;
      },
    ) => {
      const apply = options?.record === false ? replaceSideDesigns : setSideDesigns;
      apply((prev) => ({
        ...prev,
        [activeSide]: {
          ...(prev[activeSide] ?? createDefaultSideDesign()),
          ...updates,
        },
      }));
    },
    [activeSide, replaceSideDesigns, setSideDesigns],
  );

  useEffect(() => {
    // Keep authored premade overlay placement — do not shrink to print-area max
    // (catalog / PDP / admin use the template scale as-is).
    const isPremadeOverlay = Boolean(
      currentDesign.premadeDesignId ||
        currentDesign.overlayRaster ||
        currentDesign.overlaySvg ||
        currentDesign.isRecolorableOverlay,
    );
    if (isPremadeOverlay) return;
    if (currentDesign.uploadedImageScale <= imageMaxScale) return;
    updateCurrentSide(
      {
        uploadedImageScale: clampPhotoScale(
          currentDesign.uploadedImageScale,
          imageMaxScale,
        ),
      },
      { record: false },
    );
  }, [imageMaxScale, currentDesign.uploadedImageScale, currentDesign.premadeDesignId, currentDesign.overlayRaster, currentDesign.overlaySvg, currentDesign.isRecolorableOverlay, updateCurrentSide]);

  const addSticker = useCallback(
    (stickerId: string) => {
      setSideDesigns((prev) => {
        const current = prev[activeSide] ?? createDefaultSideDesign();
        if (current.stickers.length >= MAX_STICKERS_PER_SIDE) return prev;
        const placed = createPlacedSticker(stickerId, current.stickers.length);
        return {
          ...prev,
          [activeSide]: {
            ...current,
            stickers: [...current.stickers, placed],
          },
        };
      });
    },
    [activeSide],
  );

  const updateSticker = useCallback(
    (instanceId: string, updates: Partial<PlacedSticker>) => {
      setSideDesigns((prev) => {
        const current = prev[activeSide] ?? createDefaultSideDesign();
        return {
          ...prev,
          [activeSide]: {
            ...current,
            stickers: current.stickers.map((sticker) =>
              sticker.instanceId === instanceId
                ? { ...sticker, ...updates }
                : sticker,
            ),
          },
        };
      });
    },
    [activeSide],
  );

  const removeSticker = useCallback(
    (instanceId: string) => {
      setSideDesigns((prev) => {
        const current = prev[activeSide] ?? createDefaultSideDesign();
        return {
          ...prev,
          [activeSide]: {
            ...current,
            stickers: current.stickers.filter(
              (sticker) => sticker.instanceId !== instanceId,
            ),
          },
        };
      });
    },
    [activeSide],
  );

  const addPhoto = useCallback(
    (fileId: string, name: string, previewUrl: string | undefined) => {
      const current = normalizeSideDesignPhotos(
        sideDesigns[activeSide] ?? createDefaultSideDesign(),
      );
      if (current.uploadedPhotos.length >= MAX_PHOTOS_PER_SIDE) return;
      const placed = createPlacedPhoto(
        fileId,
        name,
        previewUrl,
        current.uploadedPhotos.length,
      );
      setSideDesigns((prev) => {
        const side = normalizeSideDesignPhotos(
          prev[activeSide] ?? createDefaultSideDesign(),
        );
        return {
          ...prev,
          [activeSide]: {
            ...side,
            uploadedPhotos: [...side.uploadedPhotos, placed],
            showPhotoGuide: false,
          },
        };
      });
      setSelectedElement(`photo:${placed.instanceId}`);
    },
    [activeSide, sideDesigns],
  );

  const updatePhoto = useCallback(
    (instanceId: string, updates: Partial<PlacedPhoto>) => {
      setSideDesigns((prev) => {
        const current = normalizeSideDesignPhotos(
          prev[activeSide] ?? createDefaultSideDesign(),
        );
        return {
          ...prev,
          [activeSide]: {
            ...current,
            uploadedPhotos: current.uploadedPhotos.map((photo) =>
              photo.instanceId === instanceId ? { ...photo, ...updates } : photo,
            ),
          },
        };
      });
    },
    [activeSide],
  );

  const removePhoto = useCallback(
    (instanceId: string) => {
      setSideDesigns((prev) => {
        const current = normalizeSideDesignPhotos(
          prev[activeSide] ?? createDefaultSideDesign(),
        );
        return {
          ...prev,
          [activeSide]: {
            ...current,
            uploadedPhotos: current.uploadedPhotos.filter(
              (photo) => photo.instanceId !== instanceId,
            ),
          },
        };
      });
    },
    [activeSide],
  );

  const addTextLayer = useCallback(() => {
    let newLayerId: string | null = null;
    const printPresets = product
      ? getPrintAreaPositionPresets(effectivePrintAreaInsets)
      : null;

    setSideDesigns((prev) => {
      const current = normalizeSideDesignText(
        prev[activeSide] ?? createDefaultSideDesign(),
      );
      if (current.textLayers.length >= MAX_TEXT_LAYERS_PER_SIDE) return prev;

      const spread = current.textLayers.length;
      const defaultPosition = printPresets
        ? spread % 3 === 0
          ? printPresets.top
          : spread % 3 === 1
            ? printPresets.center
            : printPresets.bottom
        : undefined;

      const placed = createPlacedTextLayer(spread, {
        position: defaultPosition,
      });
      newLayerId = placed.instanceId;

      return {
        ...prev,
        [activeSide]: syncFlatTextFields({
          ...current,
          textLayers: [...current.textLayers, placed],
        }),
      };
    });

    if (newLayerId) {
      handleSelectElement(`text:${newLayerId}`);
      setActivePanel('text');
    }
  }, [activeSide, product, effectivePrintAreaInsets, handleSelectElement]);

  const printTextSizeMax = useMemo(() => {
    if (!product) return 72;
    const inner = previewRef.current?.querySelector<HTMLElement>(
      '[data-mockup-inner]',
    );
    const height =
      inner?.offsetHeight ??
      (previewRef.current?.offsetHeight ?? 400) * 0.85;
    return getMaxTextSizeForPrintArea(height, effectivePrintAreaInsets);
  }, [product, activeSide, canvasZoom, sideDesigns, effectivePrintAreaInsets]);

  const updateTextLayer = useCallback(
    (instanceId: string, updates: Partial<PlacedTextLayer>) => {
      const cappedUpdates = { ...updates };
      if (typeof cappedUpdates.size === 'number') {
        cappedUpdates.size = Math.min(
          printTextSizeMax,
          Math.max(12, Math.round(cappedUpdates.size)),
        );
      }

      setSideDesigns((prev) => {
        const current = normalizeSideDesignText(
          prev[activeSide] ?? createDefaultSideDesign(),
        );

        return {
          ...prev,
          [activeSide]: syncFlatTextFields({
            ...current,
            textLayers: current.textLayers.map((layer) =>
              layer.instanceId === instanceId
                ? { ...layer, ...cappedUpdates }
                : layer,
            ),
          }),
        };
      });
    },
    [activeSide, printTextSizeMax],
  );

  const removeTextLayer = useCallback(
    (instanceId: string) => {
      const current = normalizeSideDesignText(
        sideDesigns[activeSide] ?? createDefaultSideDesign(),
      );
      const filtered = current.textLayers.filter(
        (layer) => layer.instanceId !== instanceId,
      );

      setSideDesigns((prev) => ({
        ...prev,
        [activeSide]: syncFlatTextFields({
          ...current,
          textLayers: filtered,
          ...(filtered.length === 0 ? { customText: '' } : {}),
        }),
      }));

      setSelectedElement((sel) =>
        sel === `text:${instanceId}` ? null : sel,
      );
      setEditingTextLayerId((editingId) =>
        editingId === instanceId
          ? (filtered[0]?.instanceId ?? null)
          : editingId,
      );
    },
    [activeSide, sideDesigns],
  );

  useEffect(() => {
    if (editCartItemId) return;
    replaceSideDesigns((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const side of sides) {
        if (!next[side]) {
          next[side] = createDefaultSideDesign();
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sides, editCartItemId, replaceSideDesigns]);

  useEffect(() => {
    if (!product || editCartItemId) return;
    const productSides = getProductSides(product);
    resetSideDesigns((prev) => {
      const next = createSideDesignsForSides(productSides);
      for (const side of productSides) {
        if (prev[side]) next[side] = prev[side];
      }
      return next;
    });
    setActiveSide('front');
  }, [product?.id, product, editCartItemId, resetSideDesigns]);

  useEffect(() => {
    if (editCartItemId || !product) return;
    if (
      colorParam &&
      product.colors?.some(
        (value) => normalizeHex(value) === normalizeHex(colorParam),
      )
    ) {
      setColor(colorParam);
    }
    if (sizeParam && product.sizes?.includes(sizeParam)) {
      setSize(sizeParam);
    }
  }, [product, colorParam, sizeParam, editCartItemId]);

  useEffect(() => {
    if (!designId || editCartItemId || !product || !activeDesignTemplate) return;
    // Wait for catalog fetch so we seed from admin-merged placement, not
    // static couple/catalog defaults (which made customizer overlays too large).
    if (!designTemplateResolved) return;
    if (activeDesignTemplate.id !== designId) return;
    if (resumeParam && findProductCustomizerDraft(product.id, designId)) return;
    if (designInitializedRef.current === designId) return;
    designInitializedRef.current = designId;

    const template = activeDesignTemplate;

    const shirtColor =
      colorParam &&
      product.colors?.some(
        (value) => normalizeHex(value) === normalizeHex(colorParam),
      )
        ? colorParam
        : color;

    const sideDesignMap = sideDesignsFromTemplate(template, product, shirtColor);
    const initialSide = getInitialCustomizerSide(template);

    if (Object.keys(sideDesignMap).length > 0) {
      resetSideDesigns((prev) => ({
        ...prev,
        ...sideDesignMap,
      }));

      if (
        template.recommendedColor &&
        product.colors?.some(
          (value) =>
            normalizeHex(value) === normalizeHex(template.recommendedColor!),
        )
      ) {
        setColor(template.recommendedColor);
      }
    }

    setActiveSide(initialSide);
  }, [
    activeDesignTemplate,
    color,
    colorParam,
    designId,
    designTemplateResolved,
    editCartItemId,
    product,
    resumeParam,
    resetSideDesigns,
  ]);

  useEffect(() => {
    if (!resumeParam || !product || editCartItemId) return;

    const draft = findProductCustomizerDraft(product.id, designId);
    if (!draft) return;

    setColor(draft.color);
    setSize(draft.size);
    setQuantity(draft.quantity);
    setActiveSide(draft.activeSide);

    const productSides = getProductSides(product);
    const restored = createSideDesignsForSides(productSides);
    for (const side of productSides) {
      const saved = draft.sideDesigns[side];
      if (saved) {
        restored[side] = {
          ...createDefaultSideDesign(),
          ...saved,
        };
      }
    }
    resetSideDesigns(restored);
  }, [product, designId, editCartItemId, resumeParam, resetSideDesigns]);

  useEffect(() => {
    if (!editCartItemId || !product) return;
    const cartItem = cartItems.find((i) => i.id === editCartItemId);
    if (!cartItem?.metadata) return;

    const meta = cartItem.metadata;
    if (typeof meta.color === 'string') setColor(meta.color);
    if (typeof meta.size === 'string') setSize(meta.size);
    if (typeof cartItem.quantity === 'number') setQuantity(cartItem.quantity);

    const restored = createSideDesignsForSides(sides);

    for (const side of sides) {
      const data = restoreSideDesignFromMetadata(meta, side);
      if (!data) continue;
      restored[side] = sideDesignFromRestored(data);
    }

    resetSideDesigns(restored);
    if (
      typeof meta.activeSide === 'string' &&
      isProductSide(meta.activeSide) &&
      sides.includes(meta.activeSide)
    ) {
      setActiveSide(meta.activeSide);
    }
  }, [editCartItemId, product, cartItems, sides, resetSideDesigns]);

  const getSideDesignForPreview = useCallback(
    (side: ProductSide): SideDesign => {
      const normalized = normalizeSideDesignText(
        normalizeSideDesignPhotos(
          sideDesigns[side] ?? createDefaultSideDesign(),
        ),
      );
      const photos = normalized.uploadedPhotos;
      if (
        photos.length === 0 ||
        photos.every((photo) => photo.previewUrl || !photo.fileId?.trim())
      ) {
        return normalized;
      }
      return {
        ...normalized,
        uploadedPhotos: hydratePlacedPhotoPreviewUrls(photos, token),
      };
    },
    [sideDesigns, token],
  );

  const mockupImage = product
    ? getProductMockup(product, color, activeSide)
    : '';

  const sideHasContent = useCallback(
    (side: ProductSide) => sideHasDesignContent(sideDesigns[side]),
    [sideDesigns],
  );

  // T-shirts always show a back tab for editing (see `sides` above), but a
  // plain front-only tee shouldn't gain a blank "back" preview/metadata —
  // only include sides that actually have content (front always counts).
  const cartSides = useMemo(() => {
    if (!isTshirt) return sides;
    return sides.filter((side) => side === 'front' || sideHasContent(side));
  }, [isTshirt, sides, sideHasContent]);

  const otherSide =
    sides.length === 2 ? sides.find((side) => side !== activeSide) : undefined;

  const copyDesignToOtherSide = useCallback(() => {
    if (!otherSide) return;
    setSideDesigns((prev) => {
      const next = copySideDesignToTarget(prev, activeSide, otherSide);
      return next ?? prev;
    });
    setSelectedElement(null);
    setActiveSide(otherSide);
  }, [activeSide, otherSide]);

  async function capturePreview(
    ref: RefObject<HTMLDivElement | null>,
  ): Promise<string | undefined> {
    if (!ref.current) return undefined;
    return capturePreviewElement(ref.current);
  }

  async function captureAllSidePreviews(): Promise<
    Partial<Record<ProductSide, string>>
  > {
    const results: Partial<Record<ProductSide, string>> = {};
    const originalSide = activeSide;

    for (const side of cartSides) {
      flushSync(() => setActiveSide(side));
      await waitForPaint();
      if (!previewRef.current) continue;
      const captured = await capturePreview(previewRef);
      if (captured) results[side] = captured;
    }

    flushSync(() => setActiveSide(originalSide));
    return results;
  }

  async function captureAllSidePrintPngs(): Promise<
    Partial<Record<ProductSide, string>>
  > {
    if (!product || isDrinkware) return {};

    const results: Partial<Record<ProductSide, string>> = {};
    const originalSide = activeSide;

    for (const side of cartSides) {
      if (!sideHasContent(side)) continue;

      const sideDesign = sideDesigns[side] ?? createDefaultSideDesign();
      if (
        premadeSideSkipsPrintPngCapture(
          sideDesign,
          activeDesignTemplate,
          side,
        )
      ) {
        continue;
      }

      flushSync(() => setActiveSide(side));
      await waitForPaint();
      if (!previewRef.current) continue;

      const insets = isTshirtProduct(product)
        ? getTshirtPrintAreaInsets('front-large', side, product)
        : getProductMockupLayout(product).printArea;

      const captured = await capturePrintAreaDesign(
        previewRef.current,
        insets,
        {
          design: sideDesign,
          template: activeDesignTemplate,
          product,
          shirtColor: color,
          side,
        },
      );
      if (captured) results[side] = captured;
    }

    flushSync(() => setActiveSide(originalSide));
    return results;
  }

  function openAddToCartPreview() {
    const incomingStickers = cartSides.reduce(
      (total, side) => total + (sideDesigns[side]?.stickers.length ?? 0),
      0,
    );
    const incomingPhotos = new Set(
      cartSides.flatMap((side) =>
        collectPlacedPhotoFileIds(
          sideDesigns[side] ?? createDefaultSideDesign(),
        ),
      ),
    ).size;

    const limits = evaluateCartAssetLimits(cartItems, {
      stickerCount: incomingStickers,
      photoCount: incomingPhotos,
      excludingItemId: editCartItemId ?? undefined,
    });

    if (!limits.ok) {
      setCartLimitError(limits.stickersOver > 0 ? 'stickers' : 'photos');
      return;
    }

    setCartLimitError(null);
    openSidesPreview();
  }

  async function handleAddToCart() {
    const incomingStickers = cartSides.reduce(
      (total, side) => total + (sideDesigns[side]?.stickers.length ?? 0),
      0,
    );
    const incomingPhotos = new Set(
      cartSides.flatMap((side) =>
        collectPlacedPhotoFileIds(
          sideDesigns[side] ?? createDefaultSideDesign(),
        ),
      ),
    ).size;

    const limits = evaluateCartAssetLimits(cartItems, {
      stickerCount: incomingStickers,
      photoCount: incomingPhotos,
      excludingItemId: editCartItemId ?? undefined,
    });

    if (!limits.ok) {
      setCartLimitError(limits.stickersOver > 0 ? 'stickers' : 'photos');
      return;
    }

    setCartLimitError(null);

    flushSync(() => setIsCapturing(true));

    let captured: Partial<Record<ProductSide, string>> = {};
    let printPngs: Partial<Record<ProductSide, string>> = {};

    try {
      if (isDrinkware) {
        // Drinkware cart thumbnails show two 3D profile snapshots (left +
        // right, ±90° Y from front) instead of the flat unwrap — closer to
        // what the buyer will actually receive.
        const drinkware3D = await captureDrinkware3DPreviews({
          productType: type,
          productId: product?.id,
          productColor: color,
          sideDesign: currentDesign,
          designTemplate: activeDesignTemplate,
          textLayers: currentDesign.textLayers,
          canvasHeightPx: drinkwareCanvasHeightPx,
          printBounds: overlayPrintBounds ?? effectivePrintAreaInsets,
        });
        if (drinkware3D) {
          captured.left = drinkware3D.left;
          captured.right = drinkware3D.right;
        } else {
          const front = await capturePreview(previewRef);
          if (front) captured.front = front;
        }
      } else if (cartSides.length > 1) {
        captured = await captureAllSidePreviews();
        printPngs = await captureAllSidePrintPngs();
      } else {
        const front = await capturePreview(previewRef);
        if (front) captured.front = front;
        printPngs = await captureAllSidePrintPngs();
      }
    } finally {
      flushSync(() => setIsCapturing(false));
    }

    // If html2canvas fails, still show the garment mockup in the cart.
    if (product) {
      for (const side of cartSides) {
        if (captured[side]) continue;
        const mockup = getProductMockup(product, color, side);
        if (mockup) captured[side] = mockup;
      }
    }

    const metadata: Record<string, string | number | boolean> = {
      productId: product?.id ?? '',
      color,
      isCustomized: true,
      activeSide,
    };
    if (product?.sizes?.length && size) {
      metadata.size = size;
    }
    if (isTshirt) {
      metadata.printPackage = printPackage;
    }

    for (const side of cartSides) {
      const d = sideDesigns[side] ?? createDefaultSideDesign();
      const prefix = getSideMetadataPrefix(side);
      writeTextMetadata(metadata, prefix, d);
      metadata[`${prefix}IsTextTemplate`] = d.isTextTemplate;
      metadata[`${prefix}UploadedImageScale`] = d.uploadedImageScale;
      metadata[`${prefix}UploadedImagePositionX`] = d.uploadedImagePosition.x;
      metadata[`${prefix}UploadedImagePositionY`] = d.uploadedImagePosition.y;
      if (d.premadeDesignImage) {
        metadata[`${prefix}PremadeDesignImage`] = d.premadeDesignImage;
      }
      if (d.premadeDesignId) {
        metadata[`${prefix}PremadeDesignId`] = d.premadeDesignId;
      }
      if (d.isRecolorableOverlay) {
        metadata[`${prefix}IsRecolorableOverlay`] = true;
        if (d.overlaySvg) metadata[`${prefix}OverlaySvg`] = d.overlaySvg;
        if (d.overlaySvgColors?.primary) {
          metadata[`${prefix}OverlaySvgPrimary`] = d.overlaySvgColors.primary;
        }
        if (d.overlaySvgColors?.secondary) {
          metadata[`${prefix}OverlaySvgSecondary`] = d.overlaySvgColors.secondary;
        }
      }
      if (d.overlayColorVariants) {
        metadata[`${prefix}HasOverlayVariants`] = true;
      }
      if (d.overlayRaster) {
        metadata[`${prefix}OverlayRaster`] = d.overlayRaster;
      }
      if (d.uploadedFile?.fileId) {
        metadata[`${prefix}UploadedFileId`] = d.uploadedFile.fileId;
      }
      if (d.uploadedFile?.previewUrl) {
        metadata[`${prefix}UploadedPreviewUrl`] = d.uploadedFile.previewUrl;
      }
      const placedPhotos = getPlacedPhotos(d);
      if (placedPhotos.length > 0) {
        metadata[`${prefix}UploadedPhotos`] = serializePlacedPhotos(placedPhotos);
        const primary = placedPhotos[0];
        metadata[`${prefix}UploadedFileId`] = primary.fileId;
        if (primary.previewUrl) {
          metadata[`${prefix}UploadedPreviewUrl`] = primary.previewUrl;
        }
        metadata[`${prefix}UploadedImageScale`] = primary.scale;
        metadata[`${prefix}UploadedImagePositionX`] = primary.position.x;
        metadata[`${prefix}UploadedImagePositionY`] = primary.position.y;
      }
      if (d.stickers.length > 0) {
        metadata[`${prefix}Stickers`] = serializePlacedStickers(d.stickers);
      }
      if (activeDesignTemplate) {
        writePremadeArtworkSourceMetadata(
          metadata,
          prefix,
          d,
          activeDesignTemplate,
          side,
        );
      }
    }

    if (designId && activeDesignTemplate) {
      metadata.designTemplateId = designId;
      metadata.designKind = activeDesignTemplate.kind;
    }

    const fileIds = cartSides.flatMap((side) =>
      collectPlacedPhotoFileIds(sideDesigns[side] ?? createDefaultSideDesign()),
    );

    const cartPayload = {
      type: 'product' as const,
      name: formatProductCartName(tp(type), size, product),
      price: unitPrice,
      quantity,
      designPreview: captured.front,
      backDesignPreview: captured.back,
      leftDesignPreview: captured.left,
      rightDesignPreview: captured.right,
      frontPrintPng: printPngs.front,
      backPrintPng: printPngs.back,
      leftPrintPng: printPngs.left,
      rightPrintPng: printPngs.right,
      metadata,
      fileIds,
    };

    if (editCartItemId) {
      updateItem(editCartItemId, cartPayload);
    } else {
      addItem(cartPayload);
    }
    unsavedWorkGuard.allowNavigation();
    router.push('/cart');
  }

  function setPositionPreset(preset: 'center' | 'top' | 'bottom') {
    const positions = product
      ? getPrintAreaPositionPresets(effectivePrintAreaInsets)
      : {
          center: { x: 50, y: 45 },
          top: { x: 50, y: 25 },
          bottom: { x: 50, y: 65 },
        };
    if (activePanel === 'text') {
      const layerId = activeTextLayerId;
      if (layerId) {
        updateTextLayer(layerId, { position: positions[preset] });
      }
    } else if (activePanel === 'photo' || activePanel === 'design') {
      if (selectedElement?.startsWith('photo:')) {
        updatePhoto(selectedElement.slice('photo:'.length), {
          position: positions[preset],
        });
      } else if (selectedElement === 'overlay') {
        updateCurrentSide({ uploadedImagePosition: positions[preset] });
      }
    }
  }

  if (!product) {
    return <p>Product not found</p>;
  }

  const canCopyDesignToOtherSide = Boolean(
    otherSide &&
      hasMultipleSides &&
      sideHasDesignContent(sideDesigns[activeSide]) &&
      !sideHasDesignContent(sideDesigns[otherSide]),
  );

  const copyDesignLabel = canCopyDesignToOtherSide
    ? otherSide === 'back'
      ? t('copyDesignToBack')
      : t('copyDesignToFront')
    : undefined;

  const hasRecolorableOverlay = Boolean(currentDesign.isRecolorableOverlay);

  function handleRemoveElement(target: SelectedElement) {
    if (!target) return;
    if (target.startsWith('text:')) {
      removeTextLayer(target.replace('text:', ''));
      setSelectedElement(null);
      return;
    }
    if (target.startsWith('photo:')) {
      removePhoto(target.slice('photo:'.length));
      setSelectedElement(null);
      return;
    }
    if (target === 'overlay') {
      updateCurrentSide(clearSideDesignArtwork());
      setSelectedElement(null);
      return;
    }
    if (target.startsWith('sticker:')) {
      removeSticker(target.replace('sticker:', ''));
    }
    setSelectedElement(null);
  }

  const previewNode = (
    <InteractivePreview
      mockupImage={mockupImage}
      sideDesign={currentDesign}
      designTemplate={activeDesignTemplate}
      shirtColor={color}
      typeLabel={tp(type)}
      productType={type}
      product={product}
      containerRef={previewRef}
      isCapturing={isCapturing}
      photoGuideLabel={t('photoGuide')}
      selectedElement={selectedElement}
      onSelectElement={handleSelectElement}
      imageMaxScale={imageMaxScale}
      textLayers={currentDesign.textLayers}
      onTextLayerPositionChange={(instanceId, pos) =>
        updateTextLayer(instanceId, { position: pos })
      }
      onTextLayerSizeChange={(instanceId, size) =>
        updateTextLayer(instanceId, { size })
      }
      onRemoveTextLayer={removeTextLayer}
      onPhotoPositionChange={(instanceId, pos) =>
        updatePhoto(instanceId, { position: pos })
      }
      onPhotoScaleChange={(instanceId, scale) =>
        updatePhoto(instanceId, {
          scale: clampPhotoScale(scale, imageMaxScale),
        })
      }
      onRemovePhoto={(instanceId) => {
        removePhoto(instanceId);
        if (selectedElement === `photo:${instanceId}`) {
          setSelectedElement(null);
        }
      }}
      onOverlayPositionChange={(pos) =>
        updateCurrentSide({ uploadedImagePosition: pos })
      }
      onOverlayScaleChange={(scale) =>
        updateCurrentSide({
          uploadedImageScale: clampPhotoScale(scale, imageMaxScale),
        })
      }
      onRemoveOverlay={() => {
        updateCurrentSide(clearSideDesignArtwork());
        setSelectedElement(null);
      }}
      removeTextLabel={t('removeText')}
      removeImageLabel={t('removeImage')}
      stickers={currentDesign.stickers}
      onStickerPositionChange={(instanceId, pos) =>
        updateSticker(instanceId, { position: pos })
      }
      onStickerScaleChange={(instanceId, scale) =>
        updateSticker(instanceId, { scale })
      }
      onRemoveSticker={removeSticker}
      removeStickerLabel={t('removeSticker')}
      printAreaOverride={isTshirt ? effectivePrintAreaInsets : undefined}
      desktopSplitPreview={isDesktopSplitPreview}
      drinkwareCanvasHeightPx={drinkwareCanvasHeightPx}
      preview3DTextLayers={preview3DTextLayers}
      preview3DSideDesign={preview3DSideDesign}
      overlayGestureHandlers={overlayGestureHandlers}
      largeCustomizerViewport={isLargeCustomizerViewport}
    />
  );

  const drinkwareSidePreviewNode =
    isDrinkware && isDesktopSplitPreview && !isCapturing ? (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-col gap-2 border-b border-ink-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Rotate3d className="h-4 w-4 text-brand-600" aria-hidden />
            <h2 className="text-sm font-semibold text-ink-900">
              {t('preview3dPaneTitle')}
            </h2>
          </div>
          <p
            role="note"
            className="rounded-lg border border-amber-300/80 bg-amber-50 px-2.5 py-2 text-xs font-medium leading-snug text-amber-950"
          >
            {t('drinkwarePreviewApproximateNote')}
          </p>
          {isMugInsideProduct(product.id) ? (
            <p
              role="note"
              className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-2 text-xs font-medium leading-snug text-brand-950"
            >
              {t('mugInsidePrintNote')}
            </p>
          ) : null}
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f4f6f8] p-4 md:p-6">
          <DrinkwareDesignPreview3D
            productType={type}
            productId={product.id}
            shirtColor={color}
            sideDesign={preview3DSideDesign}
            designTemplate={activeDesignTemplate}
            printBounds={overlayPrintBounds ?? effectivePrintAreaInsets}
            textLayers={preview3DTextLayers}
            variant="floating"
            className="w-[min(28rem,46vh)] max-w-full shadow-[0_8px_40px_rgba(15,23,42,0.12)]"
            canvasHeightPx={drinkwareCanvasHeightPx}
          />
        </div>
      </div>
    ) : null;

  const panelNode = (
    <EditorPanelContent
      panel={activePanel ?? 'product'}
      currentDesign={currentDesign}
      designTemplate={activeDesignTemplate}
      shirtColor={color}
      product={product}
      color={color}
      setColor={handleColorChange}
      size={size}
      setSize={setSize}
      quantity={quantity}
      setQuantity={setQuantity}
      updateCurrentSide={updateCurrentSide}
      setPositionPreset={setPositionPreset}
      onAddSticker={addSticker}
      onAddTextLayer={addTextLayer}
      onUpdateTextLayer={updateTextLayer}
      onSelectTextLayer={(instanceId) =>
        handleSelectElement(`text:${instanceId}`)
      }
      activeTextLayerId={activeTextLayerId}
      printTextSizeMax={printTextSizeMax}
      textLayersAtLimit={
        currentDesign.textLayers.length >= MAX_TEXT_LAYERS_PER_SIDE
      }
      stickersAtLimit={
        currentDesign.stickers.length >= MAX_STICKERS_PER_SIDE
      }
      photosAtLimit={
        getPlacedPhotos(currentDesign).length >= MAX_PHOTOS_PER_SIDE
      }
      onAddPhoto={addPhoto}
      token={token}
      uploadLoading={uploadLoading}
      uploadError={uploadError}
      refreshSession={refreshSession}
      imageMaxScale={imageMaxScale}
      isTshirt={isTshirt}
      printPackage={printPackage}
      locale={locale}
      garmentFits={garmentFits}
      garmentFit={garmentFit}
      onGarmentFitChange={handleGarmentFitChange}
      selectableColors={selectableColors}
      isDrinkware={isDrinkware}
      drinkwareBodyColors={drinkwareBodyColors}
      compatibleDrinkwareProducts={compatibleDrinkwareProducts}
      onDrinkwareProductChange={handleDrinkwareProductChange}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <OutOfPrintAreaToast />
      <CustomizerShell
      topBar={
        <div
          className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-ink-100 bg-white px-3 md:px-5"
          data-customizer-editor-chrome
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => unsavedWorkGuard.requestLeave(leaveHref)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-600"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t('backToProduct')}</span>
            </button>
            <div className="hidden h-5 w-px bg-ink-200 sm:block" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">
                {tp(type)}
              </p>
              <p className="text-xs text-brand-600">
                {formatPrice(unitPrice, locale)}
              </p>
            </div>
          </div>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={undoSideDesigns}
              disabled={!canUndo || isCapturing}
              aria-label={t('undo')}
              title={t('undoShortcut')}
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={redoSideDesigns}
              disabled={!canRedo || isCapturing}
              aria-label={t('redo')}
              title={t('redoShortcut')}
            >
              <Redo2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={openSidesPreview}
              disabled={isCapturing}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {t('previewAllSides')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void handleSaveDesign()}
              loading={saveState === 'saving'}
              disabled={isCapturing || saveState === 'saving'}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {saveState === 'saved' ? t('designSaved') : t('saveDesign')}
            </Button>
            <Button
              size="sm"
              onClick={openAddToCartPreview}
              disabled={isCapturing}
            >
              {isCapturing ? t('capturing') : t('addToCart')}
            </Button>
          </div>
        </div>
      }
      contextBar={
        <div ref={contextBarRef}>
          <CustomizerContextBar
            selected={selectedElement}
            currentDesign={currentDesign}
            designTemplate={activeDesignTemplate}
            shirtColor={color}
            onUpdate={updateCurrentSide}
            onUpdateTextLayer={updateTextLayer}
            printTextSizeMax={printTextSizeMax}
            onRemove={handleRemoveElement}
            overlayMaxScale={imageMaxScale}
          />
        </div>
      }
      canvas={previewNode}
      panel={panelNode}
      activePanel={activePanel}
      onPanelChange={setActivePanel}
      showDesignPanel={hasRecolorableOverlay}
      showColorPanel={isDrinkware && drinkwareBodyColors.length > 1}
      sides={sides}
      activeSide={activeSide}
      onSideChange={setActiveSide}
      sideLabel={sideLabel}
      sideHasContent={sideHasContent}
      hasMultipleSides={hasMultipleSides}
      copyDesignLabel={copyDesignLabel}
      onCopyDesign={canCopyDesignToOtherSide ? copyDesignToOtherSide : undefined}
      canvasZoom={canvasZoom}
      onZoomChange={setCanvasZoom}
      sidePreview={drinkwareSidePreviewNode}
      mobileStackedPreview={isDrinkware && !isDesktopSplitPreview}
      mobileBottomBar={
        <div
          className="fixed inset-x-0 bottom-0 z-[55] border-t border-ink-200 bg-white/95 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
          data-customizer-editor-chrome
        >
          {cartLimitError ? (
            <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {cartLimitError === 'stickers'
                ? t('orderStickerLimit', { max: MAX_STICKERS_PER_ORDER })
                : t('orderPhotoLimit', { max: MAX_PHOTOS_PER_ORDER })}
            </p>
          ) : null}
          <div className="mx-auto mb-2.5 flex max-w-lg items-stretch gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={undoSideDesigns}
              disabled={!canUndo || isCapturing}
              className="h-10 w-10 shrink-0 p-0 normal-case tracking-normal"
              aria-label={t('undo')}
              title={t('undoShortcut')}
            >
              <Undo2 className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={redoSideDesigns}
              disabled={!canRedo || isCapturing}
              className="h-10 w-10 shrink-0 p-0 normal-case tracking-normal"
              aria-label={t('redo')}
              title={t('redoShortcut')}
            >
              <Redo2 className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openSidesPreview}
              disabled={isCapturing}
              className="h-10 w-10 shrink-0 p-0 normal-case tracking-normal"
              aria-label={t('previewAllSides')}
            >
              <Eye className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleSaveDesign()}
              loading={saveState === 'saving'}
              disabled={isCapturing || saveState === 'saving'}
              className="h-10 w-10 shrink-0 p-0 normal-case tracking-normal"
              aria-label={
                saveState === 'saved' ? t('designSaved') : t('saveDesign')
              }
            >
              {saveState === 'saved' ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={openAddToCartPreview}
              disabled={isCapturing}
              className="h-10 min-w-0 flex-1 truncate normal-case tracking-normal"
            >
              {isCapturing ? t('capturingShort') : t('addToCart')}
            </Button>
          </div>
          <div className="mx-auto flex max-w-lg items-center gap-1">
            {(
              [
                ['product', <Shirt key="p" className="h-5 w-5" />, t('tabProduct')],
                ...(isDrinkware && drinkwareBodyColors.length > 1
                  ? [
                      [
                        'color',
                        <Palette key="c" className="h-5 w-5" />,
                        t('tabColor'),
                      ] as const,
                    ]
                  : []),
                ['text', <Type key="t" className="h-5 w-5" />, t('tabText')],
                ['photo', <ImageIcon key="i" className="h-5 w-5" />, t('tabUpload')],
                ['stickers', <Sparkles key="s" className="h-5 w-5" />, t('tabElements')],
                ...(hasRecolorableOverlay
                  ? [['design', <Palette key="d" className="h-5 w-5" />, t('designColor')] as const]
                  : []),
              ] as const
            ).map(([id, icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setActivePanel(activePanel === id ? null : (id as EditorPanel))
                }
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium',
                  activePanel === id ? 'text-brand-700' : 'text-ink-600',
                )}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </div>
      }
      mobileSheet={
        activePanel ? (
          <div className="fixed inset-0 z-[60] md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink-900/40"
              onClick={() => setActivePanel(null)}
              aria-label={t('close')}
            />
            <div
              className={cn(
                'absolute inset-x-0 bottom-0 flex max-h-[min(72vh,32rem)] flex-col rounded-t-2xl bg-white shadow-2xl',
                activePanel === 'stickers' && 'h-[min(58vh,30rem)] max-h-none',
              )}
              data-customizer-editor-chrome
            >
              <div className="flex shrink-0 items-center justify-between border-b border-ink-100 px-5 py-3">
                <h3 className="font-semibold text-ink-900">
                  {activePanel === 'product'
                    ? t('tabProduct')
                    : activePanel === 'color'
                      ? t('tabColor')
                      : activePanel === 'text'
                      ? t('tabText')
                      : activePanel === 'photo'
                        ? t('tabUpload')
                        : activePanel === 'design'
                          ? t('designColor')
                          : t('tabElements')}
                </h3>
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  className="rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-600"
                >
                  {t('close')}
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                {panelNode}
              </div>
            </div>
          </div>
        ) : null
      }
    />
      <CustomizerSidesPreviewModal
        open={sidesPreviewOpen}
        sides={cartSides}
        sideLabel={sideLabel}
        sideHasContent={sideHasContent}
        use3DPreviewLabels={isDrinkware}
        onClose={() => setSidesPreviewOpen(false)}
        onAddToCart={() => {
          setSidesPreviewOpen(false);
          void handleAddToCart();
        }}
        addToCartDisabled={isCapturing}
        addToCartLabel={
          isCapturing ? t('capturing') : t('confirmAddToCart')
        }
        renderSide={(side) => {
          const design = getSideDesignForPreview(side);

          if (isDrinkware) {
            return (
              <DrinkwareDesignPreview3D
                productType={type}
                productId={product.id}
                shirtColor={color}
                sideDesign={design}
                designTemplate={activeDesignTemplate}
                printBounds={
                  overlayPrintBounds ?? effectivePrintAreaInsets
                }
                textLayers={design.textLayers}
                variant="floating"
                className="w-full max-w-[14rem] shadow-[0_8px_40px_rgba(15,23,42,0.12)]"
                canvasHeightPx={drinkwareCanvasHeightPx}
              />
            );
          }

          const sideMockup = getProductMockup(product, color, side) ?? '';
          // Same generous chest zone used during editing (see
          // effectivePrintAreaInsets above) — content was never clamped to
          // the tighter small-print zone, so the preview must not clip it.
          const printOverride = isTshirt
            ? getTshirtPrintAreaInsets('front-large', side, product)
            : undefined;

          return (
            <InteractivePreview
              mockupImage={sideMockup}
              sideDesign={design}
              designTemplate={activeDesignTemplate}
              shirtColor={color}
              typeLabel={tp(type)}
              productType={type}
              product={product}
              isCapturing
              compact
              photoGuideLabel={t('photoGuide')}
              selectedElement={null}
              onSelectElement={() => {}}
              imageMaxScale={imageMaxScale}
              textLayers={design.textLayers}
              onTextLayerPositionChange={() => {}}
              onTextLayerSizeChange={() => {}}
              onRemoveTextLayer={() => {}}
              onPhotoPositionChange={() => {}}
              onPhotoScaleChange={() => {}}
              onOverlayPositionChange={() => {}}
              onOverlayScaleChange={() => {}}
              stickers={design.stickers}
              onStickerPositionChange={() => {}}
              onStickerScaleChange={() => {}}
              onRemoveSticker={() => {}}
              printAreaOverride={printOverride}
              referenceMockupInnerHeight={editorMockupInnerHeight}
            />
          );
        }}
      />
      <UnsavedWorkDialog
        open={unsavedWorkGuard.dialogOpen}
        saving={unsavedWorkGuard.saving}
        saveNotice={unsavedWorkGuard.saveNotice}
        onSave={unsavedWorkGuard.handleSave}
        onCancel={unsavedWorkGuard.cancelNavigation}
        onLeaveWithoutSaving={unsavedWorkGuard.handleLeaveWithoutSaving}
      />
    </div>
  );
}

function ResizableTextOverlay({
  text,
  color,
  size,
  position,
  fontFamily,
  fontWeight,
  letterSpacing,
  lineHeight,
  textShadow,
  onSizeChange,
  onPositionChange,
  onRemove,
  removeLabel,
  hideControls,
  printBounds,
  selected,
  onSelect,
  overlayGestureHandlers,
  referenceMockupInnerHeight,
}: {
  text: string;
  color: string;
  size: number;
  position: { x: number; y: number };
  fontFamily: string;
  fontWeight: number;
  letterSpacing: string;
  lineHeight: number;
  textShadow: string;
  onSizeChange: (size: number) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onRemove?: () => void;
  removeLabel?: string;
  hideControls?: boolean;
  printBounds?: PrintAreaInsets;
  selected?: boolean;
  onSelect?: () => void;
  overlayGestureHandlers?: OverlayGestureHandlers;
  referenceMockupInnerHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textContentRef = useRef<HTMLSpanElement | null>(null);
  const positionRef = useRef(position);
  const onPositionChangeRef = useRef(onPositionChange);
  const onSizeChangeRef = useRef(onSizeChange);
  const [maxTextSize, setMaxTextSize] = useState(72);
  const [mockupInnerHeight, setMockupInnerHeight] = useState(0);

  positionRef.current = position;
  onPositionChangeRef.current = onPositionChange;
  onSizeChangeRef.current = onSizeChange;

  const maxWidthPercent = printBounds
    ? getPrintAreaWidthPercent(printBounds)
    : 78;
  const isMultiline = text.includes('\n');

  useLayoutEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    if (printBounds) {
      setMaxTextSize(
        getMaxTextSizeForPrintArea(
          parent.offsetHeight,
          printBounds,
        ),
      );
    }
  }, [printBounds, size, text]);

  useLayoutEffect(() => {
    const mockupInner = containerRef.current?.closest<HTMLElement>(
      '[data-mockup-inner]',
    );
    if (!mockupInner) return;

    const measure = () => {
      setMockupInnerHeight(mockupInner.offsetHeight);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(mockupInner);
    return () => observer.disconnect();
  }, []);

  const recenterIfOutside = useCallback(() => {
    recenterIfFullyOutsidePrintArea({
      element: textContentRef.current ?? containerRef.current,
      parent: containerRef.current?.parentElement ?? null,
      printBounds,
      position: positionRef.current,
      onPositionChange: onPositionChangeRef.current,
    });
  }, [printBounds]);

  const scheduleRecenter = useCallback(() => {
    scheduleRecenterIfFullyOutsidePrintArea(() => ({
      element: textContentRef.current ?? containerRef.current,
      parent: containerRef.current?.parentElement ?? null,
      printBounds,
      position: positionRef.current,
      onPositionChange: onPositionChangeRef.current,
    }));
  }, [printBounds]);

  const drag = useDraggablePosition(
    position,
    onPositionChange,
    printBounds,
    textContentRef,
    overlayGestureHandlers,
  );

  // Text reflow (typing, font/size changes) can push the box fully outside
  // even without a drag — recover the same way, but never clamp partial
  // overlap so the layer can still sit near/over the print area edge.
  useLayoutEffect(() => {
    if (!printBounds || !text.trim()) return;
    recenterIfOutside();
  }, [
    text,
    size,
    fontFamily,
    fontWeight,
    letterSpacing,
    lineHeight,
    maxWidthPercent,
    printBounds,
    recenterIfOutside,
  ]);

  useLayoutEffect(() => {
    if (size > maxTextSize) {
      onSizeChangeRef.current(maxTextSize);
    }
  }, [maxTextSize, size]);

  const handleSizeChange = useCallback(
    (next: number) => {
      const clamped = Math.min(maxTextSize, Math.max(12, Math.round(next)));
      onSizeChangeRef.current(clamped);
    },
    [maxTextSize],
  );

  const resize = useScaleResize(
    size,
    handleSizeChange,
    12,
    maxTextSize,
    scheduleRecenter,
    overlayGestureHandlers,
  );
  const displaySize = hideControls ? size : resize.displayScale;
  const textScale =
    referenceMockupInnerHeight && mockupInnerHeight > 0
      ? mockupInnerHeight / referenceMockupInnerHeight
      : 1;
  const renderedSize = Math.max(1, Math.round(displaySize * textScale));
  const showChrome = selected && !hideControls;

  const textStyle = {
    color,
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: 'translate(-50%, -50%)',
    fontSize: `${renderedSize}px`,
    fontFamily,
    fontWeight,
    letterSpacing,
    lineHeight,
    textShadow,
    width: 'max-content' as const,
    maxWidth: `${maxWidthPercent}%`,
    whiteSpace: isMultiline ? ('pre-line' as const) : ('nowrap' as const),
  };

  const controls = (
    <>
      {onRemove && removeLabel ? (
        <OverlayRemoveButton
          onRemove={onRemove}
          label={removeLabel}
          hidden={!showChrome}
          placement="text"
        />
      ) : null}
      <div
        role="button"
        tabIndex={0}
        aria-label="Resize text"
        className="absolute -bottom-3 -right-3 z-20 flex h-5 w-5 cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-md"
        style={{ touchAction: 'none' }}
        onPointerDown={resize.onPointerDown}
        onPointerMove={resize.onPointerMove}
        onPointerUp={resize.onPointerUp}
        onPointerCancel={resize.onPointerCancel}
      />
    </>
  );

  return (
    <div
      ref={(node) => {
        containerRef.current = node;
        drag.ref.current = node;
      }}
      className={cn(
        'absolute text-center leading-tight',
        hideControls
          ? 'pointer-events-none select-none'
          : 'cursor-grab select-none active:cursor-grabbing pointer-events-auto',
      )}
      data-customizer-selected-layer={showChrome ? '' : undefined}
      data-customizer-content-layer=""
      style={{
        ...textStyle,
        touchAction: hideControls ? 'auto' : 'none',
      }}
      {...(hideControls
        ? {}
        : {
            onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
              event.stopPropagation();
              onSelect?.();
              drag.onPointerDown(event);
            },
            onPointerMove: drag.onPointerMove,
            onPointerUp: drag.onPointerUp,
            onPointerCancel: drag.onPointerCancel,
          })}
    >
      <span
        className={cn(
          'relative inline-block rounded px-1',
          showChrome && 'ring-2 ring-brand-500 ring-offset-2',
        )}
      >
        <span ref={textContentRef}>{text}</span>
        {showChrome ? controls : null}
      </span>
    </div>
  );
}

function InteractivePreview({
  mockupImage,
  sideDesign,
  designTemplate,
  shirtColor,
  typeLabel,
  productType,
  product,
  containerRef,
  isCapturing,
  photoGuideLabel,
  textLayers,
  onTextLayerPositionChange,
  onTextLayerSizeChange,
  onRemoveTextLayer,
  onPhotoPositionChange,
  onPhotoScaleChange,
  onRemovePhoto,
  onOverlayPositionChange,
  onOverlayScaleChange,
  onRemoveOverlay,
  removeTextLabel,
  removeImageLabel,
  stickers,
  onStickerPositionChange,
  onStickerScaleChange,
  onRemoveSticker,
  removeStickerLabel,
  selectedElement,
  onSelectElement,
  imageMaxScale,
  printAreaOverride,
  referenceMockupInnerHeight,
  compact = false,
  desktopSplitPreview = false,
  drinkwareCanvasHeightPx = DRINKWARE_FLAT_CANVAS_HEIGHT_PX,
  preview3DTextLayers,
  preview3DSideDesign,
  overlayGestureHandlers,
  largeCustomizerViewport = false,
}: {
  mockupImage: string;
  sideDesign: SideDesign;
  designTemplate: ProductDesignTemplate | null;
  shirtColor: string;
  typeLabel: string;
  productType: ProductType;
  product: Product;
  containerRef?: RefObject<HTMLDivElement | null>;
  isCapturing?: boolean;
  compact?: boolean;
  photoGuideLabel: string;
  textLayers: PlacedTextLayer[];
  onTextLayerPositionChange: (
    instanceId: string,
    pos: { x: number; y: number },
  ) => void;
  onTextLayerSizeChange: (instanceId: string, size: number) => void;
  onRemoveTextLayer: (instanceId: string) => void;
  onPhotoPositionChange: (
    instanceId: string,
    pos: { x: number; y: number },
  ) => void;
  onPhotoScaleChange: (instanceId: string, scale: number) => void;
  onRemovePhoto?: (instanceId: string) => void;
  onOverlayPositionChange?: (pos: { x: number; y: number }) => void;
  onOverlayScaleChange?: (scale: number) => void;
  onRemoveOverlay?: () => void;
  removeTextLabel?: string;
  removeImageLabel?: string;
  stickers: PlacedSticker[];
  onStickerPositionChange: (
    instanceId: string,
    pos: { x: number; y: number },
  ) => void;
  onStickerScaleChange: (instanceId: string, scale: number) => void;
  onRemoveSticker: (instanceId: string) => void;
  removeStickerLabel?: string;
  selectedElement: SelectedElement;
  onSelectElement: (element: SelectedElement) => void;
  imageMaxScale: number;
  printAreaOverride?: PrintAreaInsets;
  /** Mockup inner height from the editor canvas — scales text in compact previews. */
  referenceMockupInnerHeight?: number;
  /** Desktop viewport already shows a live 3D pane beside this canvas — keep the flat canvas active and skip the flat/3D toggle. */
  desktopSplitPreview?: boolean;
  drinkwareCanvasHeightPx?: number;
  /** Gated inputs for live 3D preview — frozen while overlays are dragged/resized. */
  preview3DTextLayers?: PlacedTextLayer[];
  preview3DSideDesign?: SideDesign;
  overlayGestureHandlers?: OverlayGestureHandlers;
  largeCustomizerViewport?: boolean;
}) {
  const t = useTranslations('products.customizer');
  const usesGarmentColorMockup =
    productType === 't-shirt' || productType === 'hoodie';
  const hasTemplateOverlay = Boolean(
    sideDesign.overlaySvg ||
      sideDesign.overlayColorVariants ||
      sideDesign.overlayRaster,
  );
  const shirtImage = sideDesign.bakedMockupUrl
    ? sideDesign.bakedMockupUrl
    : usesGarmentColorMockup
      ? mockupImage
      : (sideDesign.premadeDesignImage ?? mockupImage);
  const mockupImgRef = useRef<HTMLImageElement>(null);
  const [mockupLoading, setMockupLoading] = useState(false);

  useEffect(() => {
    if (!shirtImage) {
      setMockupLoading(false);
      return;
    }

    setMockupLoading(true);
    const img = mockupImgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setMockupLoading(false);
    }
  }, [shirtImage, shirtColor]);

  const baseMockupLayout = getProductMockupLayout(product);
  const mockupLayout = printAreaOverride
    ? {
        ...baseMockupLayout,
        printArea: printAreaOverride,
        overlayMaxScale: getPrintAreaMaxScale(printAreaOverride),
      }
    : baseMockupLayout;
  const shirtMockupStyle = getMockupImageDisplayStyle(
    product,
    shirtImage,
    'customizer',
    { largeCustomizerViewport },
  );
  const overlayPrintBounds = getOverlayPrintBounds(mockupLayout);
  const isDrinkware = isCylindricalDrinkwareType(productType);
  const drinkwareHasHandle =
    isDrinkware && getDrinkware3DConfig(productType, product.id).hasHandle;
  const drinkwareFlatSize = isDrinkware
    ? getDrinkwareFlatCanvasSize(productType, product.id)
    : null;
  const drinkwareBodyColor = getDrinkwareBodyColor(product.id, shirtColor);
  const sublimationPatch = getDrinkwareSublimationPatch(product.id);
  const sublimationPatchClipPath = sublimationPatch
    ? getSublimationPatchCssClipPath(sublimationPatch)
    : undefined;
  const live3DTextLayers = preview3DTextLayers ?? textLayers;
  const live3DSideDesign = preview3DSideDesign ?? sideDesign;
  const showStacked3dPreview =
    isDrinkware && !isCapturing && !desktopSplitPreview;
  const showMugInsideNote = isMugInsideProduct(product.id);
  const placedPhotos = getPlacedPhotos(sideDesign);

  // Drinkware 2D editor is a flat unwrap template — never show the mug photo.
  useEffect(() => {
    if (isDrinkware) {
      setMockupLoading(false);
    }
  }, [isDrinkware, shirtColor]);

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3',
        compact && 'w-full',
      )}
    >
    <div
      ref={containerRef}
      key={isDrinkware ? product.id : undefined}
      className={cn(
        'relative flex items-center justify-center rounded-sm touch-pan-y',
        compact
          ? cn(
              'w-full min-w-[12rem] max-w-[16rem] bg-transparent shadow-none sm:max-w-[18rem]',
              productType === 't-shirt' || productType === 'hoodie'
                ? 'overflow-visible'
                : 'overflow-hidden',
            )
          : cn(
              isDrinkware
                ? 'max-w-[min(48rem,94vw)] shadow-[0_8px_40px_rgba(15,23,42,0.08)]'
                : productType === 'hoodie'
                  ? 'w-[min(18rem,78vw)] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.12)] md:w-[min(28rem,46vh)] lg:w-[min(34rem,54vh)] xl:w-[min(38rem,60vh)]'
                  : 'w-[min(18rem,78vw)] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.12)] md:w-[min(28rem,46vh)] lg:w-[min(32rem,52vh)] xl:w-[min(36rem,58vh)]',
              // Editor keeps overflow visible so zoomed mockups and selection chrome aren't clipped.
              productType === 't-shirt' ||
              productType === 'hoodie' ||
              (isDrinkware && !isCapturing)
                ? 'overflow-visible'
                : 'overflow-hidden',
            ),
        // Drinkware: fixed unwrap px size (1:1 with texture). Else aspect classes.
        isDrinkware && drinkwareFlatSize
          ? undefined
          : productType === 't-shirt' && product.fit === 'unisex'
            ? 'aspect-square'
            : 'aspect-[3/4]',
        isCapturing && !compact && 'opacity-90',
      )}
      style={
        isDrinkware && drinkwareFlatSize
          ? {
              // Visual size may shrink on narrow viewports; logical mapping
              // always uses DRINKWARE_FLAT_CANVAS_HEIGHT_PX for 1:1 wrap sync.
              width: compact
                ? '100%'
                : `min(${drinkwareFlatSize.width}px, 94vw)`,
              aspectRatio: String(drinkwareFlatSize.aspect),
              backgroundColor: drinkwareBodyColor,
            }
          : undefined
      }
      onPointerDown={() => onSelectElement(null)}
    >
      {mockupLoading && !isCapturing && !isDrinkware ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-sm">
          <LoadingIndicator label={t('previewLoading')} size="sm" />
        </div>
      ) : null}

      <div
        data-mockup-inner
        className={cn(
          isDrinkware ? 'relative h-full w-full select-none' : mockupLayout.innerClass,
          'pointer-events-none',
          productType === 't-shirt' ||
            productType === 'hoodie' ||
            (isDrinkware && !isCapturing)
            ? 'overflow-visible'
            : 'overflow-hidden',
        )}
      >
        <div
          className="relative h-full w-full"
          style={isDrinkware ? undefined : shirtMockupStyle}
        >
        {isDrinkware ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 z-0"
              style={{ backgroundColor: drinkwareBodyColor }}
              aria-hidden
            />
          </>
        ) : shirtImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={mockupImgRef}
            key={`${shirtColor}-${shirtImage}`}
            src={shirtImage}
            alt={typeLabel}
            draggable={false}
            crossOrigin="anonymous"
            className={mockupLayout.imageClass}
            onLoad={() => setMockupLoading(false)}
            onError={() => setMockupLoading(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Shirt className="h-24 w-24 text-ink-300" />
          </div>
        )}

        {!isCapturing ? (
          <>
            {sublimationPatch ? (
              <DrinkwareSublimationPatchGuide
                productId={product.id}
                label={t('drinkwareWrapArea')}
              />
            ) : null}
            <PrintAreaGuideSwitch
              layout={mockupLayout}
              label={t('printAreaGuide')}
              wrapLabel={t('drinkwareWrapArea')}
              frontLabel={t('drinkwareFrontPreview')}
              showHandleHint={drinkwareHasHandle}
              showCenterGuide={isDrinkware && !drinkwareHasHandle}
              handleHintLabel={t('drinkwareHandleHint')}
              centerLabel={t('drinkwareCenterOfMug')}
              showWrapFrame={!sublimationPatch}
            />
          </>
        ) : null}

        <CustomizerPrintAreaLayers
          isCapturing={Boolean(isCapturing)}
          printAreaInsets={mockupLayout.printArea}
          useDimOutsideMask={!isDrinkware}
          clipPathOverride={sublimationPatchClipPath}
          patchFillColor={sublimationPatch?.patchColor}
        >
          <>
            {hasTemplateOverlay ? (
              <ResizableDesignOverlay
                design={sideDesign}
                template={designTemplate}
                shirtColor={shirtColor}
                scale={sideDesign.uploadedImageScale}
                position={sideDesign.uploadedImagePosition}
                onScaleChange={(scale) =>
                  onOverlayScaleChange?.(scale)
                }
                onPositionChange={(pos) =>
                  onOverlayPositionChange?.(pos)
                }
                onRemove={onRemoveOverlay}
                removeLabel={removeImageLabel}
                hideControls={isCapturing}
                maxScale={imageMaxScale}
                printBounds={overlayPrintBounds}
                selected={selectedElement === 'overlay'}
                onSelect={() => onSelectElement('overlay')}
                overlayGestureHandlers={overlayGestureHandlers}
              />
            ) : null}

            {placedPhotos.map((photo) => (
              <ResizableImageOverlay
                key={photo.instanceId}
                src={photo.previewUrl ?? ''}
                alt={photo.name}
                scale={photo.scale}
                position={photo.position}
                onScaleChange={(scale) =>
                  onPhotoScaleChange(photo.instanceId, scale)
                }
                onPositionChange={(pos) =>
                  onPhotoPositionChange(photo.instanceId, pos)
                }
                onRemove={() => onRemovePhoto?.(photo.instanceId)}
                removeLabel={removeImageLabel}
                hideControls={isCapturing}
                maxScale={imageMaxScale}
                printBounds={overlayPrintBounds}
                selected={selectedElement === `photo:${photo.instanceId}`}
                onSelect={() =>
                  onSelectElement(`photo:${photo.instanceId}`)
                }
                overlayGestureHandlers={overlayGestureHandlers}
              />
            ))}

            {textLayers.map((layer) =>
              layer.text ? (
                <ResizableTextOverlay
                  key={layer.instanceId}
                  text={layer.text}
                  color={layer.color}
                  size={layer.size}
                  position={layer.position}
                  fontFamily={getCustomizerFontFamily(layer.fontFamily)}
                  fontWeight={layer.fontWeight}
                  letterSpacing={layer.letterSpacing}
                  lineHeight={layer.lineHeight}
                  textShadow={layer.textShadow}
                  onSizeChange={(size) =>
                    onTextLayerSizeChange(layer.instanceId, size)
                  }
                  onPositionChange={(pos) =>
                    onTextLayerPositionChange(layer.instanceId, pos)
                  }
                  onRemove={() => onRemoveTextLayer(layer.instanceId)}
                  removeLabel={removeTextLabel}
                  hideControls={isCapturing}
                  printBounds={overlayPrintBounds}
                  selected={selectedElement === `text:${layer.instanceId}`}
                  onSelect={() =>
                    onSelectElement(`text:${layer.instanceId}`)
                  }
                  overlayGestureHandlers={overlayGestureHandlers}
                  referenceMockupInnerHeight={referenceMockupInnerHeight}
                />
              ) : null,
            )}

            {stickers.map((sticker) => (
              <ResizableStickerOverlay
                key={sticker.instanceId}
                sticker={sticker}
                onPositionChange={(pos) =>
                  onStickerPositionChange(sticker.instanceId, pos)
                }
                onScaleChange={(scale) =>
                  onStickerScaleChange(sticker.instanceId, scale)
                }
                onRemove={() => onRemoveSticker(sticker.instanceId)}
                removeLabel={removeStickerLabel}
                hideControls={isCapturing}
                printBounds={overlayPrintBounds}
                selected={selectedElement === `sticker:${sticker.instanceId}`}
                onSelect={() =>
                  onSelectElement(`sticker:${sticker.instanceId}`)
                }
                overlayGestureHandlers={overlayGestureHandlers}
              />
            ))}
          </>
        </CustomizerPrintAreaLayers>

        {sideDesign.showPhotoGuide &&
          placedPhotos.length === 0 &&
          !isCapturing && (
            <div
              className="pointer-events-none absolute flex items-center justify-center rounded-full border-2 border-dashed border-brand-400/70 bg-brand-50/40"
              style={{
                left: `${sideDesign.uploadedImagePosition.x}%`,
                top: `${sideDesign.uploadedImagePosition.y}%`,
                width: `${sideDesign.uploadedImageScale}%`,
                aspectRatio: '1',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="px-2 text-center text-[10px] font-medium leading-tight text-brand-700/80">
                {photoGuideLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>

    {showStacked3dPreview ? (
      <div className="flex w-full max-w-[min(48rem,94vw)] flex-col items-center gap-2 pb-2">
        {showMugInsideNote ? (
          <p
            role="note"
            className="w-full rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-center text-xs font-medium leading-snug text-brand-950"
          >
            {t('mugInsidePrintNote')}
          </p>
        ) : null}
        <p
          role="note"
          className="w-full rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-center text-xs font-medium leading-snug text-amber-950"
        >
          {t('drinkwarePreviewApproximateNote')}
        </p>
        <DrinkwareDesignPreview3D
          productType={productType}
          productId={product.id}
          shirtColor={shirtColor}
          sideDesign={live3DSideDesign}
          designTemplate={designTemplate}
          printBounds={overlayPrintBounds}
          textLayers={live3DTextLayers}
          variant="stacked"
          canvasHeightPx={drinkwareCanvasHeightPx}
        />
      </div>
    ) : null}

    {!isCapturing &&
    mockupLayout.wrapPrintArea &&
    !desktopSplitPreview ? (
      <div className="flex w-full max-w-[min(36rem,92vw)] flex-col items-center gap-2">
        {showMugInsideNote && !showStacked3dPreview ? (
          <p
            role="note"
            className="w-full rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-center text-xs font-medium leading-snug text-brand-950"
          >
            {t('mugInsidePrintNote')}
          </p>
        ) : null}
        <DrinkwareWrapHint>{t('drinkwareWrapHint')}</DrinkwareWrapHint>
      </div>
    ) : null}

    {!isCapturing &&
    mockupLayout.wrapPrintArea &&
    desktopSplitPreview &&
    showMugInsideNote ? (
      <p
        role="note"
        className="w-full max-w-[min(36rem,92vw)] rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-center text-xs font-medium leading-snug text-brand-950"
      >
        {t('mugInsidePrintNote')}
      </p>
    ) : null}
    </div>
  );
}

function StepperInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 active:bg-ink-50"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[3ch] text-center font-medium">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 active:bg-ink-50"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function PositionPresets({
  onPreset,
}: {
  onPreset: (p: 'center' | 'top' | 'bottom') => void;
}) {
  const t = useTranslations('products.customizer');
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onPreset('top')}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-ink-200 bg-white py-2 text-xs font-medium text-ink-700 active:bg-ink-50"
      >
        <ArrowUp className="h-3.5 w-3.5" />
        {t('positionTop')}
      </button>
      <button
        type="button"
        onClick={() => onPreset('center')}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-ink-200 bg-white py-2 text-xs font-medium text-ink-700 active:bg-ink-50"
      >
        <AlignCenter className="h-3.5 w-3.5" />
        {t('positionCenter')}
      </button>
      <button
        type="button"
        onClick={() => onPreset('bottom')}
        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-ink-200 bg-white py-2 text-xs font-medium text-ink-700 active:bg-ink-50"
      >
        <ArrowDown className="h-3.5 w-3.5" />
        {t('positionBottom')}
      </button>
    </div>
  );
}

function EditorPanelContent({
  panel,
  currentDesign,
  designTemplate,
  shirtColor,
  product,
  color,
  setColor,
  size,
  setSize,
  quantity,
  setQuantity,
  updateCurrentSide,
  setPositionPreset,
  onAddSticker,
  onAddTextLayer,
  onUpdateTextLayer,
  onSelectTextLayer,
  activeTextLayerId,
  printTextSizeMax,
  textLayersAtLimit,
  stickersAtLimit,
  photosAtLimit,
  onAddPhoto,
  token,
  uploadLoading,
  uploadError,
  refreshSession,
  imageMaxScale,
  isTshirt,
  printPackage,
  locale,
  garmentFits,
  garmentFit,
  onGarmentFitChange,
  selectableColors,
  isDrinkware,
  drinkwareBodyColors = [],
  compatibleDrinkwareProducts,
  onDrinkwareProductChange,
}: {
  panel: EditorPanel;
  currentDesign: SideDesign;
  designTemplate: ProductDesignTemplate | null;
  shirtColor: string;
  product: (typeof products)[number];
  color: string;
  setColor: (c: string) => void;
  size: string;
  setSize: (s: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  updateCurrentSide: (u: Partial<SideDesign>) => void;
  setPositionPreset: (p: 'center' | 'top' | 'bottom') => void;
  onAddSticker: (stickerId: string) => void;
  onAddTextLayer: () => void;
  onUpdateTextLayer: (
    instanceId: string,
    updates: Partial<PlacedTextLayer>,
  ) => void;
  onSelectTextLayer: (instanceId: string) => void;
  activeTextLayerId: string | null;
  printTextSizeMax: number;
  textLayersAtLimit: boolean;
  stickersAtLimit: boolean;
  photosAtLimit: boolean;
  onAddPhoto: (fileId: string, name: string, previewUrl?: string) => void;
  token: string | null;
  uploadLoading: boolean;
  uploadError: string | null;
  refreshSession: () => Promise<string | null>;
  imageMaxScale: number;
  isTshirt: boolean;
  printPackage: TshirtPrintPackage;
  locale: string;
  garmentFits: GarmentFit[];
  garmentFit: GarmentFit;
  onGarmentFitChange: (fit: GarmentFit) => void;
  selectableColors: string[];
  isDrinkware?: boolean;
  drinkwareBodyColors?: string[];
  compatibleDrinkwareProducts?: Product[];
  onDrinkwareProductChange?: (productId: string) => void;
}) {
  const t = useTranslations('products.customizer');
  const tProducts = useTranslations('products');
  const hasSecondaryInk = designTemplate?.overlayRecolor?.slots === 2;
  const primaryInk = currentDesign.overlaySvgColors?.primary ?? '#F4EDE4';
  const secondaryInk =
    currentDesign.overlaySvgColors?.secondary ?? primaryInk;
  const lowContrastPrimary = inksHaveLowContrast(primaryInk, shirtColor);
  const lowContrastSecondary =
    hasSecondaryInk && inksHaveLowContrast(secondaryInk, shirtColor);

  if (panel === 'color') {
    return (
      <div className="space-y-4">
        <DesignColorPicker
          colors={drinkwareBodyColors}
          value={color}
          onChange={setColor}
        />
      </div>
    );
  }

  if (panel === 'product') {
    return (
      <div className="space-y-5">
        <ProductOptions
          product={product}
          color={color}
          setColor={setColor}
          size={size}
          setSize={setSize}
          quantity={quantity}
          setQuantity={setQuantity}
          isTshirt={isTshirt}
          printPackage={printPackage}
          locale={locale}
          garmentFits={garmentFits}
          garmentFit={garmentFit}
          onGarmentFitChange={onGarmentFitChange}
          selectableColors={selectableColors}
          isDrinkware={isDrinkware}
          compatibleDrinkwareProducts={compatibleDrinkwareProducts}
          onDrinkwareProductChange={onDrinkwareProductChange}
        />
      </div>
    );
  }

  if (panel === 'stickers') {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {stickersAtLimit ? (
          <p className="mb-3 shrink-0 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t('stickerLimit')}
          </p>
        ) : null}
        <StickerPicker
          onSelect={onAddSticker}
          disabled={stickersAtLimit}
          compact
          className="min-h-0 flex-1"
        />
      </div>
    );
  }

  if (panel === 'text') {
    const activeLayer =
      currentDesign.textLayers.find(
        (layer) => layer.instanceId === activeTextLayerId,
      ) ?? currentDesign.textLayers[0] ??
      null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink-700">{t('textLayers')}</p>
          <button
            type="button"
            onClick={onAddTextLayer}
            disabled={textLayersAtLimit}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('addTextLayer')}
          </button>
        </div>

        {textLayersAtLimit ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t('textLayerLimit')}
          </p>
        ) : null}

        {currentDesign.textLayers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {currentDesign.textLayers.map((layer, index) => (
              <button
                key={layer.instanceId}
                type="button"
                onClick={() => onSelectTextLayer(layer.instanceId)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                  activeLayer?.instanceId === layer.instanceId
                    ? 'border-brand-300 bg-brand-50 text-brand-800'
                    : 'border-ink-200 bg-white text-ink-700 hover:border-brand-200',
                )}
              >
                {t('textLayerLabel', { number: index + 1 })}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-6 text-center text-sm text-ink-500">
            {t('textLayerEmpty')}
          </p>
        )}

        {activeLayer ? (
          <>
            <textarea
              value={activeLayer.text}
              onChange={(e) =>
                onUpdateTextLayer(activeLayer.instanceId, {
                  text: e.target.value,
                })
              }
              className="w-full rounded-xl border border-ink-200 px-4 py-3 text-base text-ink-900"
              placeholder={t('addText')}
              rows={2}
            />
            <TextLayerFontPicker
              value={activeLayer.fontFamily}
              onChange={(fontFamily: CustomizerFontId) =>
                onUpdateTextLayer(activeLayer.instanceId, { fontFamily })
              }
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-600">{t('textSize')}</span>
              <StepperInput
                value={activeLayer.size}
                onChange={(v) =>
                  onUpdateTextLayer(activeLayer.instanceId, { size: v })
                }
                min={12}
                max={printTextSizeMax}
                step={2}
              />
            </div>
            <PositionPresets onPreset={setPositionPreset} />
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm text-ink-600">{t('textColor')}</span>
              <input
                type="color"
                value={activeLayer.color}
                onChange={(e) =>
                  onUpdateTextLayer(activeLayer.instanceId, {
                    color: e.target.value,
                  })
                }
                className="h-11 w-20 cursor-pointer rounded-lg border border-ink-200"
              />
            </label>
          </>
        ) : null}
      </div>
    );
  }

  if (panel === 'design') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-600">{t('designColorHint')}</p>
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-ink-600">{t('designPrimaryColor')}</span>
          <input
            type="color"
            value={primaryInk}
            onChange={(e) =>
              updateCurrentSide({
                overlaySvgColors: {
                  primary: e.target.value,
                  secondary: currentDesign.overlaySvgColors?.secondary,
                },
              })
            }
            className="h-11 w-20 cursor-pointer rounded-lg border border-ink-200"
          />
        </label>
        {hasSecondaryInk ? (
          <label className="flex items-center justify-between gap-4">
            <span className="text-sm text-ink-600">
              {t('designSecondaryColor')}
            </span>
            <input
              type="color"
              value={secondaryInk}
              onChange={(e) =>
                updateCurrentSide({
                  overlaySvgColors: {
                    primary: currentDesign.overlaySvgColors?.primary ?? primaryInk,
                    secondary: e.target.value,
                  },
                })
              }
              className="h-11 w-20 cursor-pointer rounded-lg border border-ink-200"
            />
          </label>
        ) : null}
        {lowContrastPrimary || lowContrastSecondary ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t('designLowContrast')}
          </p>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() =>
            updateCurrentSide({
              overlaySvgColors: {
                primary: suggestInkForShirt(shirtColor),
                secondary: designTemplate?.overlayRecolor?.secondary
                  ? suggestInkForShirt(shirtColor) === '#F4EDE4'
                    ? '#8B7355'
                    : '#C4B5A0'
                  : undefined,
              },
            })
          }
        >
          {t('designAutoContrast')}
        </Button>
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-600">{t('imageSize')}</span>
          <StepperInput
            value={currentDesign.uploadedImageScale}
            onChange={(v) =>
              updateCurrentSide({
                uploadedImageScale: clampPhotoScale(v, imageMaxScale),
              })
            }
            min={PRODUCT_PHOTO_MIN_SCALE}
            max={imageMaxScale}
            step={2}
          />
        </div>
        <PositionPresets onPreset={setPositionPreset} />
      </div>
    );
  }

  if (panel === 'photo') {
    const placedPhotos = getPlacedPhotos(currentDesign);
    const hasIncludedDesign = sideHasPremadeOverlayArtwork(currentDesign);

    return (
      <div className="space-y-4">
        {hasIncludedDesign ? (
          <div className="rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2.5">
            <p className="text-sm font-medium text-ink-900">
              {designTemplate
                ? resolveProductDesignDisplayName(
                    designTemplate,
                    locale as 'mk' | 'en',
                    (key) => tProducts(key),
                  )
                : t('includedDesign')}
            </p>
            <p className="mt-0.5 text-xs text-ink-500">
              {t('includedDesignHint')}
            </p>
          </div>
        ) : null}

        {photosAtLimit ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {t('photoSideLimit', { max: MAX_PHOTOS_PER_SIDE })}
          </p>
        ) : null}

        {placedPhotos.length > 0 ? (
          <ul className="space-y-2">
            {placedPhotos.map((photo, index) => (
              <li
                key={photo.instanceId}
                className="flex items-center justify-between gap-2 rounded-lg border border-ink-200 bg-ink-50/60 px-3 py-2"
              >
                <span className="min-w-0 truncate text-sm text-ink-800">
                  {photo.name || t('photo')} {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateCurrentSide({
                      uploadedPhotos: placedPhotos.filter(
                        (item) => item.instanceId !== photo.instanceId,
                      ),
                    })
                  }
                  className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  {t('removePhoto')}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {!photosAtLimit ? (
          <ProductPhotoUpload
            token={token}
            uploadLoading={uploadLoading}
            uploadError={uploadError}
            refreshSession={refreshSession}
            hasPhoto={false}
            onUploadComplete={(fileId, name, previewUrl) => {
              onAddPhoto(fileId, name, previewUrl);
            }}
          />
        ) : null}
      </div>
    );
  }

  return null;
}

const TSHIRT_PRINT_PACKAGE_LABELS: Record<
  TshirtPrintPackage,
  { title: string; description: string }
> = {
  blank: {
    title: 'printPackageBlank',
    description: 'printPackageBlankDesc',
  },
  'front-small': {
    title: 'printPackageFrontSmall',
    description: 'printPackageFrontSmallDesc',
  },
  'front-large': {
    title: 'printPackageFrontLarge',
    description: 'printPackageFrontLargeDesc',
  },
  'back-small': {
    title: 'printPackageBackSmall',
    description: 'printPackageBackSmallDesc',
  },
  'back-large': {
    title: 'printPackageBackLarge',
    description: 'printPackageBackLargeDesc',
  },
  'front-small-back-small': {
    title: 'printPackageFrontSmallBackSmall',
    description: 'printPackageFrontSmallBackSmallDesc',
  },
  'front-small-back-large': {
    title: 'printPackageFrontSmallBackLarge',
    description: 'printPackageFrontSmallBackLargeDesc',
  },
  'front-large-back-small': {
    title: 'printPackageFrontLargeBackSmall',
    description: 'printPackageFrontLargeBackSmallDesc',
  },
  'front-large-back-large': {
    title: 'printPackageFrontLargeBackLarge',
    description: 'printPackageFrontLargeBackLargeDesc',
  },
  'front-back': {
    title: 'printPackageFrontBack',
    description: 'printPackageFrontBackDesc',
  },
};

function ProductOptions({
  product,
  color,
  setColor,
  size,
  setSize,
  quantity,
  setQuantity,
  isTshirt,
  printPackage,
  locale,
  garmentFits,
  garmentFit,
  onGarmentFitChange,
  selectableColors,
  isDrinkware,
  compatibleDrinkwareProducts,
  onDrinkwareProductChange,
}: {
  product: (typeof products)[number];
  color: string;
  setColor: (c: string) => void;
  size: string;
  setSize: (s: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  isTshirt?: boolean;
  printPackage?: TshirtPrintPackage;
  locale?: string;
  garmentFits?: GarmentFit[];
  garmentFit?: GarmentFit;
  onGarmentFitChange?: (fit: GarmentFit) => void;
  selectableColors?: string[];
  isDrinkware?: boolean;
  compatibleDrinkwareProducts?: Product[];
  onDrinkwareProductChange?: (productId: string) => void;
}) {
  const t = useTranslations('products.customizer');
  const colors = isDrinkware
    ? getDrinkwareBodyColorOptions(product)
    : selectableColors?.length
      ? selectableColors
      : product.colors;

  return (
    <>
      {isDrinkware &&
      compatibleDrinkwareProducts?.length &&
      onDrinkwareProductChange ? (
        <DrinkwareProductSelector
          products={compatibleDrinkwareProducts}
          value={product.id}
          onChange={onDrinkwareProductChange}
        />
      ) : null}
      {isTshirt && printPackage ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-700">
            {t('printPackage')}
          </label>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-ink-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900">
                {t(TSHIRT_PRINT_PACKAGE_LABELS[printPackage].title)}
              </p>
              <p className="text-xs text-ink-500">
                {t('printPackageAutoNote')}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-brand-700">
              {formatPrice(getTshirtUnitPrice(printPackage), locale ?? 'mk')}
            </span>
          </div>
        </div>
      ) : null}
      {garmentFits && garmentFits.length > 1 && garmentFit && onGarmentFitChange ? (
        <GarmentFitSelector
          fits={garmentFits}
          value={garmentFit}
          onChange={onGarmentFitChange}
        />
      ) : null}
      {!isDrinkware && colors && colors.length > 1 ? (
        <DesignColorPicker
          colors={colors}
          value={color}
          onChange={setColor}
        />
      ) : null}
      {product.sizes && (
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-700">
            {t('selectSize')}
          </label>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSize(s)}
                className={`min-h-11 min-w-11 rounded-lg px-4 py-2 text-sm font-medium ${
                  size === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-ink-100 text-ink-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink-700">
          {t('quantity')}
        </label>
        <StepperInput
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={100}
        />
      </div>
    </>
  );
}
