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
import html2canvas from 'html2canvas';
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
import { useCart } from '@/components/cart/CartProvider';
import { useUploadSession } from '@/hooks/useUploadSession';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import {
  formatProductCartName,
  restoreSideDesignFromMetadata,
} from '@/lib/cart/product-cart';
import { PRODUCT_MOCKUP_INNER_CLASS } from '@/components/products/ProductMockupFrame';
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
import {
  Shirt,
  Type,
  ImageIcon,
  ArrowLeft,
  Minus,
  Plus,
  AlignCenter,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';

type EditorPanel = 'text' | 'photo' | null;

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
}: {
  onRemove: () => void;
  label: string;
  hideControls?: boolean;
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
      className="absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-ink-900/90 text-white shadow-md transition hover:bg-ink-900"
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
      className="absolute cursor-grab active:cursor-grabbing"
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
  const hasTwoSides = product ? productSupportsSides(product) : false;

  const [color, setColor] = useState(product?.colors?.[0] || '#ffffff');
  const [size, setSize] = useState(product?.sizes?.[0] ?? '');
  const [quantity, setQuantity] = useState(1);
  const [activeSide, setActiveSide] = useState<ProductSide>('front');
  const [sideDesigns, setSideDesigns] = useState<
    Record<ProductSide, SideDesign>
  >({
    front: createDefaultSideDesign(),
    back: createDefaultSideDesign(),
  });
  const [activePanel, setActivePanel] = useState<EditorPanel>(null);

  const previewRef = useRef<HTMLDivElement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const currentDesign = sideDesigns[activeSide];

  const updateCurrentSide = useCallback(
    (updates: Partial<SideDesign>) => {
      setSideDesigns((prev) => ({
        ...prev,
        [activeSide]: { ...prev[activeSide], ...updates },
      }));
    },
    [activeSide],
  );

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

    const restored: Record<ProductSide, SideDesign> = {
      front: createDefaultSideDesign(),
      back: createDefaultSideDesign(),
    };

    for (const side of sides) {
      const data = restoreSideDesignFromMetadata(meta, side);
      if (!data) continue;
      restored[side] = sideDesignFromRestored(data);
    }

    setSideDesigns(restored);
    if (typeof meta.activeSide === 'string' && (meta.activeSide === 'front' || meta.activeSide === 'back')) {
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
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#f4f4f5',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      return canvas.toDataURL('image/png');
    } catch {
      return undefined;
    }
  }

  async function captureAllSidePreviews(): Promise<{
    front?: string;
    back?: string;
  }> {
    const results: { front?: string; back?: string } = {};
    const originalSide = activeSide;

    for (const side of sides) {
      flushSync(() => setActiveSide(side));
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const captured = await capturePreview(previewRef);
      if (captured) results[side] = captured;
    }

    flushSync(() => setActiveSide(originalSide));
    return results;
  }

  async function handleAddToCart() {
    flushSync(() => setIsCapturing(true));

    let frontPreview: string | undefined;
    let backPreview: string | undefined;

    try {
      if (hasTwoSides) {
        const captured = await captureAllSidePreviews();
        frontPreview = captured.front;
        backPreview = captured.back;
      } else {
        frontPreview = await capturePreview(previewRef);
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
      const d = sideDesigns[side];
      const prefix = side === 'front' ? 'front' : 'back';
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
      designPreview: frontPreview,
      backDesignPreview: backPreview,
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
    return Boolean(d.customText || d.uploadedFile || d.premadeDesignImage);
  };

  const hasPremadeImage = Boolean(currentDesign.premadeDesignImage);
  const hasTextTemplate = Boolean(currentDesign.isTextTemplate);

  return (
    <div className="pb-28 lg:pb-0">
      <Link
        href={`/products/${product.id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToProduct')}
      </Link>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        {/* Preview column */}
        <div className="space-y-4">
          {hasTwoSides && (
            <div className="flex rounded-xl bg-ink-100 p-1">
              {sides.map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setActiveSide(side)}
                  className={`relative flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    activeSide === side
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  {side === 'front' ? t('front') : t('back')}
                  {sideHasContent(side) && activeSide !== side && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />
                  )}
                </button>
              ))}
            </div>
          )}

          <Card className="flex items-center justify-center p-4 sm:p-6">
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
            />
          </Card>

          <p className="text-center text-xs text-ink-500">
            {hasTextTemplate
              ? t('textTemplateHint')
              : hasPremadeImage
                ? t('premadeDesignHint')
                : t('resizeHint')}
          </p>
        </div>

        {/* Controls column — desktop */}
        <div className="hidden space-y-5 lg:block">
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

      {/* Mobile bottom toolbar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          {hasTwoSides && (
            <div className="flex rounded-lg bg-ink-100 p-0.5">
              {sides.map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setActiveSide(side)}
                  className={`rounded-md px-3 py-2 text-xs font-semibold ${
                    activeSide === side
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-ink-600'
                  }`}
                >
                  {side === 'front' ? t('front') : t('back')}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() =>
              setActivePanel(activePanel === 'text' ? null : 'text')
            }
            className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
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
            className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              activePanel === 'photo'
                ? 'text-brand-700'
                : 'text-ink-600'
            }`}
          >
            <ImageIcon className="h-5 w-5" />
            {t('photo')}
          </button>
          <Button
            size="sm"
            onClick={handleAddToCart}
            className="shrink-0"
            disabled={isCapturing}
          >
            {isCapturing ? t('capturing') : t('addToCart')}
          </Button>
        </div>
      </div>

      {/* Mobile editor sheet */}
      {activePanel && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setActivePanel(null)}
            aria-label={t('close')}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-ink-900">
                {activePanel === 'text' ? t('addText') : t('addPhoto')}
              </h3>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                className="rounded-full bg-ink-100 px-3 py-1 text-sm text-ink-600"
              >
                {t('close')}
              </button>
            </div>
            <EditorPanelContent
              panel={activePanel}
              currentDesign={currentDesign}
              updateCurrentSide={updateCurrentSide}
              setPositionPreset={setPositionPreset}
              token={token}
              uploadLoading={uploadLoading}
              uploadError={uploadError}
              refreshSession={refreshSession}
            />
          </div>
        </div>
      )}

      {/* Mobile product options (color, size, qty) */}
      <div className="mt-6 space-y-5 lg:hidden">
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
      className="absolute cursor-grab select-none text-center font-bold leading-tight active:cursor-grabbing"
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
}) {
  const baseImage = sideDesign.premadeDesignImage ?? mockupImage;
  const isPremade = Boolean(sideDesign.premadeDesignImage);

  return (
    <div
      ref={containerRef}
      className={`relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 shadow-inner ${isCapturing ? 'opacity-90' : ''}`}
      style={{ touchAction: 'none' }}
    >
      <div className={PRODUCT_MOCKUP_INNER_CLASS}>
        {baseImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={baseImage}
            alt={typeLabel}
            draggable={false}
            crossOrigin="anonymous"
            className="pointer-events-none h-full w-full object-contain"
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
  token,
  uploadLoading,
  uploadError,
  refreshSession,
}: {
  panel: EditorPanel;
  currentDesign: SideDesign;
  updateCurrentSide: (u: Partial<SideDesign>) => void;
  setPositionPreset: (p: 'center' | 'top' | 'bottom') => void;
  token: string | null;
  uploadLoading: boolean;
  uploadError: string | null;
  refreshSession: () => Promise<string | null>;
}) {
  const t = useTranslations('products.customizer');

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

      <div className="flex gap-2">
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
      </div>

      {activePanel && (
        <Card>
          <EditorPanelContent
            panel={activePanel}
            currentDesign={currentDesign}
            updateCurrentSide={updateCurrentSide}
            setPositionPreset={setPositionPreset}
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
