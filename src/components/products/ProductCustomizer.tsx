'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import {
  capturePreviewElement,
  waitForPaint,
} from '@/lib/products/capture-preview';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import {
  products,
  getProductMockup,
  getProductSides,
  getProductDesignTemplate,
  productSupportsSides,
  type ProductSide,
  type ProductType,
} from '@/lib/data/catalog';
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
import { getProductMockupLayout } from '@/lib/products/product-mockup-layout';
import {
  createSideDesignsForSides,
  getSideMetadataPrefix,
  isProductSide,
} from '@/lib/products/product-sides';
import {
  createDefaultSideDesign,
  sideDesignFromImageTemplate,
  sideDesignFromOverlayTemplate,
  sideDesignFromRestored,
  sideDesignFromTextTemplate,
  type SideDesign,
  type UploadedFile,
} from '@/lib/products/design-state';
import {
  PRODUCT_PHOTO_MIN_SCALE,
  PRODUCT_PRINT_AREA_MAX_SCALE,
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
} from 'lucide-react';

import {
  inksHaveLowContrast,
  suggestInkForShirt,
} from '@/lib/products/design-overlay';
import { useOverlayAssetUrl } from '@/hooks/useOverlayAssetUrl';
import { Palette } from 'lucide-react';
import type {
  EditorPanel,
  SelectedElement,
} from '@/components/products/customizer/types';
import { CustomizerShell } from '@/components/products/customizer/CustomizerShell';
import { CustomizerContextBar } from '@/components/products/customizer/CustomizerContextBar';
import { UnsavedWorkDialog } from '@/components/shared/UnsavedWorkDialog';
import { useDirtySnapshot } from '@/hooks/useDirtySnapshot';
import { useUnsavedWorkGuard } from '@/hooks/useUnsavedWorkGuard';
import {
  serializeSideDesigns,
  upsertProductCustomizerDraft,
} from '@/lib/drafts/work-drafts';
import { findProductCustomizerDraft } from '@/lib/drafts/ongoing-designs';

function useDraggablePosition(
  position: { x: number; y: number },
  onChange: (pos: { x: number; y: number }) => void,
) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const positionRef = useRef(position);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  positionRef.current = position;

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !dragStartRef.current) return;
    event.preventDefault();
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
    onChange({
      x: (nextX / parentRect.width) * 100,
      y: (nextY / parentRect.height) * 100,
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      draggingRef.current = false;
      dragStartRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
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
) {
  const draggingRef = useRef(false);
  const startRef = useRef({ pointerX: 0, pointerY: 0, scale: 0 });

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    startRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      scale,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    event.preventDefault();
    const delta =
      event.clientX - startRef.current.pointerX +
      (event.clientY - startRef.current.pointerY);
    const next = Math.min(
      max,
      Math.max(min, Math.round(startRef.current.scale + delta * 0.15)),
    );
    onScaleChange(next);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      draggingRef.current = false;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    }
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  };
}

function OverlayRemoveButton({
  onRemove,
  label,
  hideControls,
  placement = 'image',
}: {
  onRemove: () => void;
  label: string;
  hideControls?: boolean;
  placement?: 'image' | 'text';
}) {
  if (hideControls) return null;

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
          ? 'absolute -top-2 left-[calc(100%+0.375rem)] z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ink-900/90 text-white shadow-md transition hover:bg-ink-900'
          : 'absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ink-900/90 text-white shadow-md transition hover:bg-ink-900'
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
  selected,
  onSelect,
}: {
  design: SideDesign;
  template: ReturnType<typeof getProductDesignTemplate> | null | undefined;
  shirtColor: string;
  scale: number;
  position: { x: number; y: number };
  onScaleChange: (scale: number) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onRemove?: () => void;
  removeLabel?: string;
  hideControls?: boolean;
  maxScale?: number;
  selected?: boolean;
  onSelect?: () => void;
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
      selected={selected}
      onSelect={onSelect}
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
  selected,
  onSelect,
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
  selected?: boolean;
  onSelect?: () => void;
}) {
  const drag = useDraggablePosition(position, onPositionChange);
  const resize = useScaleResize(
    scale,
    (next) => onScaleChange(clampPhotoScale(next)),
    PRODUCT_PHOTO_MIN_SCALE,
    maxScale ?? PRODUCT_PRINT_AREA_MAX_SCALE,
  );

  return (
    <div
      ref={drag.ref}
      className="absolute cursor-grab active:cursor-grabbing pointer-events-auto"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${scale}%`,
        transform: 'translate(-50%, -50%)',
        touchAction: 'none',
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect?.();
        drag.onPointerDown(event);
      }}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
    >
      <div
        className={cn(
          'relative rounded-lg',
          selected && !hideControls && 'ring-2 ring-brand-500 ring-offset-2',
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
      {onRemove && removeLabel ? (
        <OverlayRemoveButton
          onRemove={onRemove}
          label={removeLabel}
          hideControls={hideControls}
        />
      ) : null}
      <div
        role="button"
        tabIndex={0}
        aria-label="Resize"
        className={`absolute -bottom-2 -right-2 flex h-6 w-6 cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-md ${hideControls ? 'hidden' : ''}`}
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
  selected,
  onSelect,
}: {
  sticker: PlacedSticker;
  onScaleChange: (scale: number) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onRemove?: () => void;
  removeLabel?: string;
  hideControls?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const definition = getStickerById(sticker.stickerId);
  const drag = useDraggablePosition(sticker.position, onPositionChange);
  const resize = useScaleResize(sticker.scale, onScaleChange, 12, 52);

  if (!definition) return null;

  return (
    <div
      ref={drag.ref}
      className="absolute cursor-grab active:cursor-grabbing pointer-events-auto"
      style={{
        left: `${sticker.position.x}%`,
        top: `${sticker.position.y}%`,
        width: `${sticker.scale}%`,
        transform: 'translate(-50%, -50%)',
        touchAction: 'none',
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect?.();
        drag.onPointerDown(event);
      }}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
    >
      <div
        className={cn(
          'relative rounded-lg',
          selected && !hideControls && 'ring-2 ring-brand-500 ring-offset-2',
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
        {onRemove && removeLabel ? (
          <OverlayRemoveButton
            onRemove={onRemove}
            label={removeLabel}
            hideControls={hideControls}
          />
        ) : null}
        <div
          role="button"
          tabIndex={0}
          aria-label="Resize sticker"
          className={`absolute -bottom-2 -right-2 flex h-6 w-6 cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-md ${hideControls ? 'hidden' : ''}`}
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

  const productId = searchParams.get('id');
  const designId = searchParams.get('design');
  const editCartItemId = searchParams.get('edit');
  const colorParam = searchParams.get('color');
  const sizeParam = searchParams.get('size');

  const product = useMemo(
    () =>
      products.find((p) => p.id === productId) ||
      products.find((p) => p.type === type),
    [productId, type],
  );

  const sides = useMemo(
    () => (product ? getProductSides(product) : ['front' as ProductSide]),
    [product],
  );
  const hasMultipleSides = product ? productSupportsSides(product) : false;
  const sideLabel = useCallback(
    (side: ProductSide) => {
      if (side === 'front') return t('front');
      if (side === 'back') return t('back');
      if (side === 'left') return t('left');
      return t('right');
    },
    [t],
  );

  const [color, setColor] = useState(product?.colors?.[0] || '#ffffff');
  const [size, setSize] = useState(product?.sizes?.[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  const [activeSide, setActiveSide] = useState<ProductSide>('front');
  const [sideDesigns, setSideDesigns] = useState<Record<ProductSide, SideDesign>>(
    () => createSideDesignsForSides(sides),
  );
  const [activePanel, setActivePanel] = useState<EditorPanel>('text');
  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [canvasZoom, setCanvasZoom] = useState(100);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cartLimitError, setCartLimitError] = useState<
    'stickers' | 'photos' | null
  >(null);

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

  const currentDesign =
    sideDesigns[activeSide] ?? createDefaultSideDesign();

  const updateCurrentSide = useCallback(
    (updates: Partial<SideDesign>) => {
      setSideDesigns((prev) => ({
        ...prev,
        [activeSide]: {
          ...(prev[activeSide] ?? createDefaultSideDesign()),
          ...updates,
        },
      }));
    },
    [activeSide],
  );

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

  useEffect(() => {
    if (editCartItemId) return;
    setSideDesigns((prev) => {
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
  }, [sides, editCartItemId]);

  useEffect(() => {
    if (!product || editCartItemId) return;
    const productSides = getProductSides(product);
    setSideDesigns((prev) => {
      const next = createSideDesignsForSides(productSides);
      for (const side of productSides) {
        if (prev[side]) next[side] = prev[side];
      }
      return next;
    });
    setActiveSide('front');
  }, [product?.id, product, editCartItemId]);

  useEffect(() => {
    if (editCartItemId || !product) return;
    if (
      colorParam &&
      product.colors?.some(
        (value) => value.toLowerCase() === colorParam.toLowerCase(),
      )
    ) {
      setColor(colorParam);
    }
    if (sizeParam && product.sizes?.includes(sizeParam)) {
      setSize(sizeParam);
    }
  }, [product, colorParam, sizeParam, editCartItemId]);

  useEffect(() => {
    if (!designId || editCartItemId || !product) return;
    if (findProductCustomizerDraft(product.id, designId)) return;

    const template = getProductDesignTemplate(designId);
    if (!template) return;

    const side = template.defaultSide;
    const textDesign = sideDesignFromTextTemplate(template);
    const imageDesign = sideDesignFromImageTemplate(template);
    const overlayDesign = sideDesignFromOverlayTemplate(template, product, color);

    if (textDesign) {
      setSideDesigns((prev) => ({
        ...prev,
        [side]: textDesign,
      }));
    } else if (overlayDesign) {
      setSideDesigns((prev) => ({
        ...prev,
        [side]: overlayDesign,
      }));
      if (
        template.recommendedColor &&
        product?.colors?.some(
          (value) => value.toLowerCase() === template.recommendedColor!.toLowerCase(),
        )
      ) {
        setColor(template.recommendedColor);
      }
    } else if (imageDesign) {
      setSideDesigns((prev) => ({
        ...prev,
        [side]: imageDesign,
      }));
    }

    setActiveSide(side);
  }, [designId, editCartItemId, product]);

  useEffect(() => {
    if (!product || editCartItemId) return;

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
    setSideDesigns(restored);
  }, [product, designId, editCartItemId]);

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

    setSideDesigns(restored);
    if (
      typeof meta.activeSide === 'string' &&
      isProductSide(meta.activeSide) &&
      sides.includes(meta.activeSide)
    ) {
      setActiveSide(meta.activeSide);
    }
  }, [editCartItemId, product, cartItems, sides]);

  const mockupImage = product
    ? getProductMockup(product, color, activeSide)
    : '';

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

    for (const side of sides) {
      flushSync(() => setActiveSide(side));
      await waitForPaint();
      if (!previewRef.current) continue;
      const captured = await capturePreview(previewRef);
      if (captured) results[side] = captured;
    }

    flushSync(() => setActiveSide(originalSide));
    return results;
  }

  async function handleAddToCart() {
    const incomingStickers = sides.reduce(
      (total, side) => total + (sideDesigns[side]?.stickers.length ?? 0),
      0,
    );
    const incomingPhotos = new Set(
      sides
        .map((side) => sideDesigns[side]?.uploadedFile?.fileId)
        .filter((id): id is string => Boolean(id)),
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

    try {
      if (hasMultipleSides) {
        captured = await captureAllSidePreviews();
      } else {
        const front = await capturePreview(previewRef);
        if (front) captured.front = front;
      }
    } finally {
      flushSync(() => setIsCapturing(false));
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

    for (const side of sides) {
      const d = sideDesigns[side] ?? createDefaultSideDesign();
      const prefix = getSideMetadataPrefix(side);
      metadata[`${prefix}CustomText`] = d.customText;
      metadata[`${prefix}CustomTextColor`] = d.customTextColor;
      metadata[`${prefix}CustomTextSize`] = d.customTextSize;
      metadata[`${prefix}CustomTextPositionX`] = d.customTextPosition.x;
      metadata[`${prefix}CustomTextPositionY`] = d.customTextPosition.y;
      metadata[`${prefix}CustomTextFontWeight`] = d.customTextFontWeight;
      metadata[`${prefix}CustomTextLetterSpacing`] = d.customTextLetterSpacing;
      metadata[`${prefix}CustomTextLineHeight`] = d.customTextLineHeight;
      metadata[`${prefix}CustomTextShadow`] = d.customTextShadow;
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
      if (d.stickers.length > 0) {
        metadata[`${prefix}Stickers`] = serializePlacedStickers(d.stickers);
      }
    }

    if (designId) {
      metadata.designTemplateId = designId;
      const template = getProductDesignTemplate(designId);
      if (template) metadata.designKind = template.kind;
    }

    const fileIds = sides
      .map((s) => sideDesigns[s].uploadedFile?.fileId)
      .filter((id): id is string => Boolean(id));

    const cartPayload = {
      type: 'product' as const,
      name: formatProductCartName(tp(type), size, product),
      price: product?.basePrice ?? 0,
      quantity,
      designPreview: captured.front,
      backDesignPreview: captured.back,
      leftDesignPreview: captured.left,
      rightDesignPreview: captured.right,
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
    const positions = {
      center: { x: 50, y: 45 },
      top: { x: 50, y: 25 },
      bottom: { x: 50, y: 65 },
    };
    if (activePanel === 'text') {
      updateCurrentSide({ customTextPosition: positions[preset] });
    } else if (activePanel === 'photo' || activePanel === 'design') {
      updateCurrentSide({ uploadedImagePosition: positions[preset] });
    }
  }

  if (!product) {
    return <p>Product not found</p>;
  }

  const sideHasContent = (side: ProductSide) => {
    const d = sideDesigns[side];
    if (!d) return false;
    return Boolean(
      d.customText ||
        d.uploadedFile ||
        d.premadeDesignImage ||
        d.overlaySvg ||
        d.overlayColorVariants ||
        d.stickers.length,
    );
  };

  const activeDesignTemplate = useMemo(() => {
    const id = designId ?? currentDesign.premadeDesignId;
    return id ? getProductDesignTemplate(id) : null;
  }, [designId, currentDesign.premadeDesignId]);

  const hasRecolorableOverlay = Boolean(currentDesign.isRecolorableOverlay);

  function handleRemoveElement(target: SelectedElement) {
    if (!target) return;
    if (target === 'text') updateCurrentSide({ customText: '' });
    if (target === 'photo') updateCurrentSide({ uploadedFile: null });
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
      containerRef={previewRef}
      isCapturing={isCapturing}
      photoGuideLabel={t('photoGuide')}
      selectedElement={selectedElement}
      onSelectElement={setSelectedElement}
      onTextPositionChange={(pos) =>
        updateCurrentSide({ customTextPosition: pos })
      }
      onTextSizeChange={(size) => updateCurrentSide({ customTextSize: size })}
      onImagePositionChange={(pos) =>
        updateCurrentSide({ uploadedImagePosition: pos })
      }
      onImageScaleChange={(scale) =>
        updateCurrentSide({
          uploadedImageScale: clampPhotoScale(scale),
        })
      }
      onRemoveText={() => updateCurrentSide({ customText: '' })}
      onRemoveImage={() => updateCurrentSide({ uploadedFile: null })}
      removeTextLabel={t('removeText')}
      removeImageLabel={t('removePhoto')}
      stickers={currentDesign.stickers}
      onStickerPositionChange={(instanceId, pos) =>
        updateSticker(instanceId, { position: pos })
      }
      onStickerScaleChange={(instanceId, scale) =>
        updateSticker(instanceId, { scale })
      }
      onRemoveSticker={removeSticker}
      removeStickerLabel={t('removeSticker')}
    />
  );

  const panelNode = (
    <EditorPanelContent
      panel={activePanel ?? 'text'}
      currentDesign={currentDesign}
      designTemplate={activeDesignTemplate}
      shirtColor={color}
      product={product}
      color={color}
      setColor={setColor}
      size={size}
      setSize={setSize}
      quantity={quantity}
      setQuantity={setQuantity}
      updateCurrentSide={updateCurrentSide}
      setPositionPreset={setPositionPreset}
      onAddSticker={addSticker}
      stickersAtLimit={
        currentDesign.stickers.length >= MAX_STICKERS_PER_SIDE
      }
      token={token}
      uploadLoading={uploadLoading}
      uploadError={uploadError}
      refreshSession={refreshSession}
    />
  );

  return (
    <>
      <CustomizerShell
      topBar={
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-ink-100 bg-white px-3 md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => unsavedWorkGuard.requestLeave(`/products/${product.id}`)}
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
                {formatPrice(product.basePrice, locale)}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={isCapturing}
            className="shrink-0"
          >
            {isCapturing ? t('capturing') : t('addToCart')}
          </Button>
        </div>
      }
      contextBar={
        <CustomizerContextBar
          selected={selectedElement}
          currentDesign={currentDesign}
          designTemplate={activeDesignTemplate}
          shirtColor={color}
          onUpdate={updateCurrentSide}
          onRemove={handleRemoveElement}
          overlayMaxScale={getProductMockupLayout(product).overlayMaxScale}
        />
      }
      canvas={previewNode}
      panel={panelNode}
      activePanel={activePanel}
      onPanelChange={setActivePanel}
      showDesignPanel={hasRecolorableOverlay}
      sides={sides}
      activeSide={activeSide}
      onSideChange={setActiveSide}
      sideLabel={sideLabel}
      sideHasContent={sideHasContent}
      hasMultipleSides={hasMultipleSides}
      canvasZoom={canvasZoom}
      onZoomChange={setCanvasZoom}
      mobileBottomBar={
        <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-ink-200 bg-white/95 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
          {cartLimitError ? (
            <p className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {cartLimitError === 'stickers'
                ? t('orderStickerLimit', { max: MAX_STICKERS_PER_ORDER })
                : t('orderPhotoLimit', { max: MAX_PHOTOS_PER_ORDER })}
            </p>
          ) : null}
          <div className="mx-auto flex max-w-lg items-center gap-1">
            {(
              [
                ['product', <Shirt key="p" className="h-5 w-5" />, t('tabProduct')],
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
            >
              <div className="flex shrink-0 items-center justify-between border-b border-ink-100 px-5 py-3">
                <h3 className="font-semibold text-ink-900">
                  {activePanel === 'product'
                    ? t('tabProduct')
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
      <UnsavedWorkDialog
        open={unsavedWorkGuard.dialogOpen}
        saving={unsavedWorkGuard.saving}
        saveNotice={unsavedWorkGuard.saveNotice}
        onSave={unsavedWorkGuard.handleSave}
        onCancel={unsavedWorkGuard.cancelNavigation}
        onLeaveWithoutSaving={unsavedWorkGuard.handleLeaveWithoutSaving}
      />
    </>
  );
}

function ResizableTextOverlay({
  text,
  color,
  size,
  position,
  fontWeight,
  letterSpacing,
  lineHeight,
  textShadow,
  onSizeChange,
  onPositionChange,
  onRemove,
  removeLabel,
  hideControls,
  selected,
  onSelect,
}: {
  text: string;
  color: string;
  size: number;
  position: { x: number; y: number };
  fontWeight: number;
  letterSpacing: string;
  lineHeight: number;
  textShadow: string;
  onSizeChange: (size: number) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onRemove?: () => void;
  removeLabel?: string;
  hideControls?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const drag = useDraggablePosition(position, onPositionChange);
  const resize = useScaleResize(size, onSizeChange, 12, 72);

  return (
    <div
      ref={drag.ref}
      className="absolute cursor-grab select-none text-center font-bold leading-tight active:cursor-grabbing pointer-events-auto"
      style={{
        color,
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: `${size}px`,
        fontWeight,
        letterSpacing,
        lineHeight,
        textShadow,
        touchAction: 'none',
        maxWidth: '78%',
        whiteSpace: 'pre-line',
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect?.();
        drag.onPointerDown(event);
      }}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
    >
      <span
        className={cn(
          'relative inline-block max-w-full rounded px-1',
          selected && !hideControls && 'ring-2 ring-brand-500 ring-offset-2',
        )}
      >
      {text}
      {onRemove && removeLabel ? (
        <OverlayRemoveButton
          onRemove={onRemove}
          label={removeLabel}
          hideControls={hideControls}
          placement="text"
        />
      ) : null}
      <div
        role="button"
        tabIndex={0}
        aria-label="Resize text"
        className={`absolute -bottom-3 -right-3 flex h-5 w-5 cursor-se-resize items-center justify-center rounded-full border-2 border-white bg-brand-600 shadow-md ${hideControls ? 'hidden' : ''}`}
        style={{ touchAction: 'none' }}
        onPointerDown={resize.onPointerDown}
        onPointerMove={resize.onPointerMove}
        onPointerUp={resize.onPointerUp}
        onPointerCancel={resize.onPointerCancel}
      />
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
  containerRef,
  isCapturing,
  photoGuideLabel,
  onTextPositionChange,
  onTextSizeChange,
  onImagePositionChange,
  onImageScaleChange,
  onRemoveText,
  onRemoveImage,
  removeTextLabel,
  removeImageLabel,
  stickers,
  onStickerPositionChange,
  onStickerScaleChange,
  onRemoveSticker,
  removeStickerLabel,
  selectedElement,
  onSelectElement,
}: {
  mockupImage: string;
  sideDesign: SideDesign;
  designTemplate: ReturnType<typeof getProductDesignTemplate> | null;
  shirtColor: string;
  typeLabel: string;
  productType: ProductType;
  containerRef: RefObject<HTMLDivElement | null>;
  isCapturing?: boolean;
  photoGuideLabel: string;
  onTextPositionChange: (pos: { x: number; y: number }) => void;
  onTextSizeChange: (size: number) => void;
  onImagePositionChange: (pos: { x: number; y: number }) => void;
  onImageScaleChange: (scale: number) => void;
  onRemoveText?: () => void;
  onRemoveImage?: () => void;
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
}) {
  const t = useTranslations('products.customizer');
  const baseImage = sideDesign.premadeDesignImage ?? mockupImage;
  const isPremade = Boolean(sideDesign.premadeDesignImage);
  const hasTemplateOverlay = Boolean(
    sideDesign.overlaySvg || sideDesign.overlayColorVariants,
  );
  const mockupImgRef = useRef<HTMLImageElement>(null);
  const [mockupLoading, setMockupLoading] = useState(false);

  useEffect(() => {
    if (!baseImage) {
      setMockupLoading(false);
      return;
    }

    setMockupLoading(true);
    const img = mockupImgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setMockupLoading(false);
    }
  }, [baseImage]);

  const mockupLayout = getProductMockupLayout(productType);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex aspect-[3/4] w-[min(18rem,78vw)] items-center justify-center rounded-sm bg-white shadow-[0_8px_40px_rgba(15,23,42,0.12)] touch-pan-y md:w-[min(28rem,46vh)] lg:w-[min(32rem,52vh)] xl:w-[min(36rem,58vh)]',
        isCapturing && 'opacity-90',
      )}
      onPointerDown={() => onSelectElement(null)}
    >
      {mockupLoading && !isCapturing ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-sm">
          <LoadingIndicator label={t('previewLoading')} size="sm" />
        </div>
      ) : null}

      <div className={`${mockupLayout.innerClass} pointer-events-none`}>
        {baseImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={mockupImgRef}
            key={baseImage}
            src={baseImage}
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

        {!isPremade && (
          <div className={mockupLayout.printAreaClass} />
        )}

        {hasTemplateOverlay ? (
          <ResizableDesignOverlay
            design={sideDesign}
            template={designTemplate}
            shirtColor={shirtColor}
            scale={sideDesign.uploadedImageScale}
            position={sideDesign.uploadedImagePosition}
            onScaleChange={onImageScaleChange}
            onPositionChange={onImagePositionChange}
            hideControls={isCapturing}
            maxScale={mockupLayout.overlayMaxScale}
            selected={selectedElement === 'overlay'}
            onSelect={() => onSelectElement('overlay')}
          />
        ) : null}

        {sideDesign.uploadedFile?.isImage &&
          sideDesign.uploadedFile.previewUrl &&
          !hasTemplateOverlay ? (
            <ResizableImageOverlay
              src={sideDesign.uploadedFile.previewUrl}
              alt={sideDesign.uploadedFile.name}
              scale={sideDesign.uploadedImageScale}
              position={sideDesign.uploadedImagePosition}
              onScaleChange={onImageScaleChange}
              onPositionChange={onImagePositionChange}
              onRemove={onRemoveImage}
              removeLabel={removeImageLabel}
              hideControls={isCapturing}
              maxScale={mockupLayout.overlayMaxScale}
              selected={selectedElement === 'photo'}
              onSelect={() => onSelectElement('photo')}
            />
          ) : null}

        {sideDesign.customText && (
          <ResizableTextOverlay
            text={sideDesign.customText}
            color={sideDesign.customTextColor}
            size={sideDesign.customTextSize}
            position={sideDesign.customTextPosition}
            fontWeight={sideDesign.customTextFontWeight}
            letterSpacing={sideDesign.customTextLetterSpacing}
            lineHeight={sideDesign.customTextLineHeight}
            textShadow={sideDesign.customTextShadow}
            onSizeChange={onTextSizeChange}
            onPositionChange={onTextPositionChange}
            onRemove={onRemoveText}
            removeLabel={removeTextLabel}
            hideControls={isCapturing}
            selected={selectedElement === 'text'}
            onSelect={() => onSelectElement('text')}
          />
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
            selected={selectedElement === `sticker:${sticker.instanceId}`}
            onSelect={() =>
              onSelectElement(`sticker:${sticker.instanceId}`)
            }
          />
        ))}

        {sideDesign.showPhotoGuide &&
          !sideDesign.uploadedFile?.previewUrl &&
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
  stickersAtLimit,
  token,
  uploadLoading,
  uploadError,
  refreshSession,
}: {
  panel: EditorPanel;
  currentDesign: SideDesign;
  designTemplate: ReturnType<typeof getProductDesignTemplate> | null;
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
  stickersAtLimit: boolean;
  token: string | null;
  uploadLoading: boolean;
  uploadError: string | null;
  refreshSession: () => Promise<string | null>;
}) {
  const t = useTranslations('products.customizer');
  const overlayMaxScale = getProductMockupLayout(product).overlayMaxScale;
  const hasSecondaryInk = designTemplate?.overlayRecolor?.slots === 2;
  const primaryInk = currentDesign.overlaySvgColors?.primary ?? '#F4EDE4';
  const secondaryInk =
    currentDesign.overlaySvgColors?.secondary ?? primaryInk;
  const lowContrastPrimary = inksHaveLowContrast(primaryInk, shirtColor);
  const lowContrastSecondary =
    hasSecondaryInk && inksHaveLowContrast(secondaryInk, shirtColor);

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
    return (
      <div className="space-y-4">
        <textarea
          value={currentDesign.customText}
          onChange={(e) => updateCurrentSide({ customText: e.target.value })}
          className="w-full rounded-xl border border-ink-200 px-4 py-3 text-base text-ink-900"
          placeholder={t('addText')}
          rows={2}
        />
        <div className="flex items-center justify-between">
          <span className="text-sm text-ink-600">{t('textSize')}</span>
          <StepperInput
            value={currentDesign.customTextSize}
            onChange={(v) => updateCurrentSide({ customTextSize: v })}
            min={12}
            max={60}
            step={2}
          />
        </div>
        <PositionPresets onPreset={setPositionPreset} />
        <label className="flex items-center justify-between gap-4">
          <span className="text-sm text-ink-600">{t('textColor')}</span>
          <input
            type="color"
            value={currentDesign.customTextColor}
            onChange={(e) =>
              updateCurrentSide({ customTextColor: e.target.value })
            }
            className="h-11 w-20 cursor-pointer rounded-lg border border-ink-200"
          />
        </label>
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
              updateCurrentSide({ uploadedImageScale: clampPhotoScale(v) })
            }
            min={PRODUCT_PHOTO_MIN_SCALE}
            max={overlayMaxScale}
            step={2}
          />
        </div>
        <PositionPresets onPreset={setPositionPreset} />
      </div>
    );
  }

  if (panel === 'photo') {
    return (
      <div className="space-y-4">
        {currentDesign.uploadedFile ? (
          <>
            <p className="text-sm font-medium text-ink-900">
              {currentDesign.uploadedFile.name}
            </p>
            <ProductPhotoUpload
              token={token}
              uploadLoading={uploadLoading}
              uploadError={uploadError}
              refreshSession={refreshSession}
              hasPhoto
              previewUrl={currentDesign.uploadedFile.previewUrl}
              onUploadComplete={(fileId, name, previewUrl) => {
                updateCurrentSide({
                  uploadedFile: {
                    fileId,
                    name,
                    isImage: true,
                    previewUrl,
                  },
                  showPhotoGuide: false,
                  uploadedImageScale: clampPhotoScale(
                    currentDesign.uploadedImageScale,
                  ),
                });
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-600">{t('imageSize')}</span>
              <StepperInput
                value={currentDesign.uploadedImageScale}
                onChange={(v) =>
                  updateCurrentSide({ uploadedImageScale: clampPhotoScale(v) })
                }
                min={PRODUCT_PHOTO_MIN_SCALE}
                max={overlayMaxScale}
                step={2}
              />
            </div>
            <PositionPresets onPreset={setPositionPreset} />
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => updateCurrentSide({ uploadedFile: null })}
            >
              {t('removePhoto')}
            </Button>
          </>
        ) : (
          <ProductPhotoUpload
            token={token}
            uploadLoading={uploadLoading}
            uploadError={uploadError}
            refreshSession={refreshSession}
            hasPhoto={false}
            onUploadComplete={(fileId, name, previewUrl) => {
              updateCurrentSide({
                uploadedFile: {
                  fileId,
                  name,
                  isImage: true,
                  previewUrl,
                },
                showPhotoGuide: false,
                uploadedImageScale: clampPhotoScale(
                  currentDesign.uploadedImageScale,
                ),
              });
            }}
          />
        )}
      </div>
    );
  }

  return null;
}

function ProductOptions({
  product,
  color,
  setColor,
  size,
  setSize,
  quantity,
  setQuantity,
}: {
  product: (typeof products)[number];
  color: string;
  setColor: (c: string) => void;
  size: string;
  setSize: (s: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
}) {
  const t = useTranslations('products.customizer');

  return (
    <>
      {product.colors && (
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-700">
            {t('selectColor')}
          </label>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-11 w-11 rounded-full border-2 transition ${
                  color === c
                    ? 'border-brand-600 ring-2 ring-brand-200'
                    : 'border-ink-200'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
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
