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
import { Link, useRouter } from '@/i18n/routing';
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
import { Card } from '@/components/ui/Card';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { cn, formatPrice } from '@/lib/utils';
import {
  formatProductCartName,
  restoreSideDesignFromMetadata,
} from '@/lib/cart/product-cart';
import { PRODUCT_MOCKUP_INNER_CLASS } from '@/components/products/ProductMockupFrame';
import {
  createSideDesignsForSides,
  getSideMetadataPrefix,
  isProductSide,
} from '@/lib/products/product-sides';
import {
  createDefaultSideDesign,
  sideDesignFromImageTemplate,
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

type EditorPanel = 'text' | 'photo' | 'stickers' | null;

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
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
    >
      <div className="relative">
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
}: {
  sticker: PlacedSticker;
  onScaleChange: (scale: number) => void;
  onPositionChange: (pos: { x: number; y: number }) => void;
  onRemove?: () => void;
  removeLabel?: string;
  hideControls?: boolean;
}) {
  const definition = getStickerById(sticker.stickerId);
  if (!definition) return null;

  const drag = useDraggablePosition(sticker.position, onPositionChange);
  const resize = useScaleResize(sticker.scale, onScaleChange, 12, 52);

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
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
    >
      <div className="relative">
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

function ProductSideTabs({
  sides,
  activeSide,
  onSelect,
  sideHasContent,
  label,
  compact = false,
}: {
  sides: ProductSide[];
  activeSide: ProductSide;
  onSelect: (side: ProductSide) => void;
  sideHasContent: (side: ProductSide) => boolean;
  label: (side: ProductSide) => string;
  compact?: boolean;
}) {
  const isScrollable = sides.length > 2;

  return (
    <div
      className={cn(
        'flex gap-1 rounded-xl bg-ink-100 p-1',
        isScrollable &&
          'overflow-x-auto snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      )}
      role="tablist"
    >
      {sides.map((side) => (
        <button
          key={side}
          type="button"
          role="tab"
          aria-selected={activeSide === side}
          onClick={() => onSelect(side)}
          className={cn(
            'relative rounded-lg font-semibold transition',
            isScrollable
              ? 'min-w-[4.25rem] shrink-0 snap-start px-2 py-2 text-[11px] leading-tight'
              : 'flex-1 px-4 py-2.5 text-sm',
            compact && !isScrollable && 'px-3 py-2 text-xs',
            activeSide === side
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-ink-600 hover:text-ink-900',
          )}
        >
          {label(side)}
          {sideHasContent(side) && activeSide !== side ? (
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
          ) : null}
        </button>
      ))}
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
  const [activePanel, setActivePanel] = useState<EditorPanel>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cartLimitError, setCartLimitError] = useState<
    'stickers' | 'photos' | null
  >(null);

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
    if (!designId || editCartItemId) return;
    const template = getProductDesignTemplate(designId);
    if (!template) return;

    const side = template.defaultSide;
    const textDesign = sideDesignFromTextTemplate(template);
    const imageDesign = sideDesignFromImageTemplate(template);

    if (textDesign) {
      setSideDesigns((prev) => ({
        ...prev,
        [side]: textDesign,
      }));
    } else if (imageDesign) {
      setSideDesigns((prev) => ({
        ...prev,
        [side]: imageDesign,
      }));
    }

    setActiveSide(side);
  }, [designId, editCartItemId]);

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
    } else if (activePanel === 'photo') {
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
      d.customText || d.uploadedFile || d.premadeDesignImage || d.stickers.length,
    );
  };

  const hasPremadeImage = Boolean(currentDesign.premadeDesignImage);
  const hasTextTemplate = Boolean(currentDesign.isTextTemplate);

  return (
    <div className="pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <Link
        href={`/products/${product.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToProduct')}
      </Link>

      {cartLimitError ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {cartLimitError === 'stickers'
            ? t('orderStickerLimit', { max: MAX_STICKERS_PER_ORDER })
            : t('orderPhotoLimit', { max: MAX_PHOTOS_PER_ORDER })}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start xl:gap-8">
        {/* Preview column */}
        <div className="space-y-4 touch-pan-y">
          {hasMultipleSides && (
            <ProductSideTabs
              sides={sides}
              activeSide={activeSide}
              onSelect={setActiveSide}
              sideHasContent={sideHasContent}
              label={sideLabel}
            />
          )}

          <Card className="flex items-center justify-center p-4 sm:p-6">
            <div className="mx-auto w-full max-w-[min(18rem,calc(100%-2.5rem))] touch-pan-y md:max-w-md lg:max-w-lg xl:max-w-sm">
              <InteractivePreview
                mockupImage={mockupImage}
                sideDesign={currentDesign}
                typeLabel={tp(type)}
                containerRef={previewRef}
                isCapturing={isCapturing}
                photoGuideLabel={t('photoGuide')}
                onTextPositionChange={(pos) =>
                  updateCurrentSide({ customTextPosition: pos })
                }
                onTextSizeChange={(size) =>
                  updateCurrentSide({ customTextSize: size })
                }
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
            </div>
          </Card>

          <p className="text-center text-xs text-ink-500">
            {hasTextTemplate
              ? t('textTemplateHint')
              : hasPremadeImage
                ? t('premadeDesignHint')
                : t('resizeHint')}
          </p>
        </div>

        {/* Controls — inline from tablet up; sidebar on wide desktop */}
        <div className="hidden space-y-5 md:block xl:sticky xl:top-24 xl:self-start">
          <ProductControls
            product={product}
            type={type}
            color={color}
            setColor={setColor}
            size={size}
            setSize={setSize}
            quantity={quantity}
            setQuantity={setQuantity}
            activePanel={activePanel}
            setActivePanel={setActivePanel}
            currentDesign={currentDesign}
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
            onAddToCart={handleAddToCart}
            isCapturing={isCapturing}
            locale={locale}
          />
        </div>
      </div>

      {/* Phone bottom toolbar — fixed to viewport so actions stay reachable while scrolling */}
      <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-ink-200 bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
          {hasMultipleSides && sides.length === 2 ? (
            <div className="col-span-4 mb-2">
              <ProductSideTabs
                sides={sides}
                activeSide={activeSide}
                onSelect={setActiveSide}
                sideHasContent={sideHasContent}
                label={sideLabel}
                compact
              />
            </div>
          ) : null}
          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === 'text' ? null : 'text')
            }
            className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium ${
              activePanel === 'text'
                ? 'text-brand-700'
                : 'text-ink-600'
            }`}
          >
            <Type className="h-5 w-5" />
            {t('text')}
          </button>
          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === 'photo' ? null : 'photo')
            }
            className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium ${
              activePanel === 'photo'
                ? 'text-brand-700'
                : 'text-ink-600'
            }`}
          >
            <ImageIcon className="h-5 w-5" />
            {t('photo')}
          </button>
          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === 'stickers' ? null : 'stickers')
            }
            className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[11px] font-medium ${
              activePanel === 'stickers'
                ? 'text-brand-700'
                : 'text-ink-600'
            }`}
          >
            <Sparkles className="h-5 w-5" />
            {t('stickers')}
          </button>
          <Button
            size="sm"
            onClick={handleAddToCart}
            className="h-full min-h-[3rem] w-full px-2"
            disabled={isCapturing}
          >
            {isCapturing ? t('capturing') : t('addToCart')}
          </Button>
        </div>
      </div>

      {/* Phone editor sheet */}
      {activePanel && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setActivePanel(null)}
            aria-label={t('close')}
          />
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl bg-white shadow-2xl',
              activePanel === 'stickers'
                ? 'h-[min(58vh,30rem)]'
                : 'max-h-[min(72vh,32rem)]',
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-ink-100 px-5 py-3">
              <h3 className="font-semibold text-ink-900">
                {activePanel === 'text'
                  ? t('addText')
                  : activePanel === 'photo'
                    ? t('addPhoto')
                    : t('addStickers')}
              </h3>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-600"
              >
                {t('close')}
              </button>
            </div>
            <div
              className={cn(
                'min-h-0 flex-1',
                activePanel === 'stickers'
                  ? 'overflow-hidden px-5 pb-1 pt-3'
                  : 'overflow-y-auto px-5 py-4',
              )}
            >
              <EditorPanelContent
                panel={activePanel}
                currentDesign={currentDesign}
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
            </div>
          </div>
        </div>
      )}

      {/* Phone-only options when compact controls are hidden */}
      <div className="mt-6 space-y-5 md:hidden">
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
    </div>
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
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onPointerCancel={drag.onPointerCancel}
    >
      <span className="relative inline-block max-w-full">
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
  typeLabel,
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
}: {
  mockupImage: string;
  sideDesign: SideDesign;
  typeLabel: string;
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
}) {
  const t = useTranslations('products.customizer');
  const baseImage = sideDesign.premadeDesignImage ?? mockupImage;
  const isPremade = Boolean(sideDesign.premadeDesignImage);
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

  return (
    <div
      ref={containerRef}
      className={`relative flex aspect-square w-full items-center justify-center rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 shadow-inner touch-pan-y ${isCapturing ? 'opacity-90' : ''}`}
    >
      {mockupLoading && !isCapturing ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/75 backdrop-blur-sm">
          <LoadingIndicator label={t('previewLoading')} size="sm" />
        </div>
      ) : null}

      <div className={`${PRODUCT_MOCKUP_INNER_CLASS} pointer-events-none`}>
        {baseImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={mockupImgRef}
            key={baseImage}
            src={baseImage}
            alt={typeLabel}
            draggable={false}
            crossOrigin="anonymous"
            className="pointer-events-none h-full w-full object-contain"
            onLoad={() => setMockupLoading(false)}
            onError={() => setMockupLoading(false)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Shirt className="h-24 w-24 text-ink-300" />
          </div>
        )}

        {!isPremade && (
          <div className="pointer-events-none absolute inset-[12%] rounded-xl border-2 border-dashed border-brand-300/40" />
        )}

        {sideDesign.uploadedFile?.isImage &&
          sideDesign.uploadedFile.previewUrl && (
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
            />
          )}

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
                max={PRODUCT_PRINT_AREA_MAX_SCALE}
                step={5}
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

function ProductControls({
  product,
  type,
  color,
  setColor,
  size,
  setSize,
  quantity,
  setQuantity,
  activePanel,
  setActivePanel,
  currentDesign,
  updateCurrentSide,
  setPositionPreset,
  onAddSticker,
  stickersAtLimit,
  token,
  uploadLoading,
  uploadError,
  refreshSession,
  onAddToCart,
  isCapturing,
  locale,
}: {
  product: (typeof products)[number];
  type: ProductType;
  color: string;
  setColor: (c: string) => void;
  size: string;
  setSize: (s: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  activePanel: EditorPanel;
  setActivePanel: (p: EditorPanel) => void;
  currentDesign: SideDesign;
  updateCurrentSide: (u: Partial<SideDesign>) => void;
  setPositionPreset: (p: 'center' | 'top' | 'bottom') => void;
  onAddSticker: (stickerId: string) => void;
  stickersAtLimit: boolean;
  token: string | null;
  uploadLoading: boolean;
  uploadError: string | null;
  refreshSession: () => Promise<string | null>;
  onAddToCart: () => void;
  isCapturing: boolean;
  locale: string;
}) {
  const t = useTranslations('products.customizer');
  const tp = useTranslations('products.types');

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-ink-900">{tp(type)}</h2>
        <p className="mt-1 text-lg text-brand-600">
          {formatPrice(product.basePrice, locale)}
        </p>
      </div>

      {currentDesign.premadeDesignImage && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {t('premadeDesignHint')}
        </p>
      )}

      {currentDesign.isTextTemplate && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
          {t('textTemplateHint')}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant={activePanel === 'text' ? 'primary' : 'secondary'}
          onClick={() =>
            setActivePanel(activePanel === 'text' ? null : 'text')
          }
          className="gap-2"
        >
          <Type className="h-4 w-4" />
          {currentDesign.customText ? t('editText') : t('addText')}
        </Button>
        <Button
          variant={activePanel === 'photo' ? 'primary' : 'secondary'}
          onClick={() =>
            setActivePanel(activePanel === 'photo' ? null : 'photo')
          }
          className="gap-2"
        >
          <ImageIcon className="h-4 w-4" />
          {currentDesign.uploadedFile ? t('editPhoto') : t('addPhoto')}
        </Button>
        <Button
          variant={activePanel === 'stickers' ? 'primary' : 'secondary'}
          onClick={() =>
            setActivePanel(activePanel === 'stickers' ? null : 'stickers')
          }
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {currentDesign.stickers.length > 0
            ? t('editStickers')
            : t('addStickers')}
        </Button>
      </div>

      {stickersAtLimit && activePanel === 'stickers' ? (
        <p className="text-sm text-amber-700">{t('stickerLimit')}</p>
      ) : null}

      {activePanel && (
        <Card>
          <EditorPanelContent
            panel={activePanel}
            currentDesign={currentDesign}
            updateCurrentSide={updateCurrentSide}
            setPositionPreset={setPositionPreset}
            onAddSticker={onAddSticker}
            stickersAtLimit={stickersAtLimit}
            token={token}
            uploadLoading={uploadLoading}
            uploadError={uploadError}
            refreshSession={refreshSession}
          />
        </Card>
      )}

      <ProductOptions
        product={product}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        quantity={quantity}
        setQuantity={setQuantity}
      />

      <Button
        size="lg"
        onClick={onAddToCart}
        className="w-full"
        disabled={isCapturing}
      >
        {isCapturing
          ? t('capturing')
          : `${t('addToCart')} — ${formatPrice(product.basePrice * quantity, locale)}`}
      </Button>
    </>
  );
}
