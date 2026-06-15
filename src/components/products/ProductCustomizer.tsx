'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import Image from 'next/image';
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
import { SecureUpload } from '@/components/upload/SecureUpload';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
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
} from 'lucide-react';

interface UploadedFile {
  fileId: string;
  name: string;
  previewUrl?: string;
  isImage?: boolean;
}

interface SideDesign {
  customText: string;
  customTextColor: string;
  customTextSize: number;
  customTextPosition: { x: number; y: number };
  uploadedFile: UploadedFile | null;
  uploadedImageScale: number;
  uploadedImagePosition: { x: number; y: number };
  templateImage: string | null;
  templateScale: number;
  templatePosition: { x: number; y: number };
}

type EditorPanel = 'text' | 'photo' | null;

function createDefaultSideDesign(): SideDesign {
  return {
    customText: '',
    customTextColor: '#000000',
    customTextSize: 18,
    customTextPosition: { x: 50, y: 30 },
    uploadedFile: null,
    uploadedImageScale: 60,
    uploadedImagePosition: { x: 50, y: 45 },
    templateImage: null,
    templateScale: 45,
    templatePosition: { x: 50, y: 40 },
  };
}

function isImageFile(fileName: string) {
  return /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(fileName);
}

function useDraggablePosition(
  position: { x: number; y: number },
  onChange: (pos: { x: number; y: number }) => void,
) {
  const dragPointerId = useRef<number | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [dragStart, setDragStart] = useState<{
    startX: number;
    startY: number;
  } | null>(null);

  return {
    ref: elementRef,
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => {
      dragPointerId.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragStart({ startX: event.clientX, startY: event.clientY });
    },
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStart || dragPointerId.current !== event.pointerId) return;
      const deltaX = event.clientX - dragStart.startX;
      const deltaY = event.clientY - dragStart.startY;
      const parent = elementRef.current?.parentElement;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const currentX = (position.x / 100) * parentRect.width;
      const currentY = (position.y / 100) * parentRect.height;
      const nextX = Math.min(Math.max(currentX + deltaX, 0), parentRect.width);
      const nextY = Math.min(Math.max(currentY + deltaY, 0), parentRect.height);
      onChange({
        x: (nextX / parentRect.width) * 100,
        y: (nextY / parentRect.height) * 100,
      });
      setDragStart({ startX: event.clientX, startY: event.clientY });
    },
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragPointerId.current === event.pointerId) {
        event.currentTarget.releasePointerCapture(event.pointerId);
        dragPointerId.current = null;
        setDragStart(null);
      }
    },
    onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragPointerId.current === event.pointerId) {
        event.currentTarget.releasePointerCapture(event.pointerId);
        dragPointerId.current = null;
        setDragStart(null);
      }
    },
  };
}

function ProductPreview({
  mockupImage,
  sideDesign,
  showPrintArea,
  containerRef,
  interactive,
  typeLabel,
}: {
  mockupImage: string;
  sideDesign: SideDesign;
  showPrintArea?: boolean;
  containerRef?: RefObject<HTMLDivElement | null>;
  interactive?: boolean;
  typeLabel: string;
}) {
  const textDrag = useDraggablePosition(
    sideDesign.customTextPosition,
    () => {},
  );
  const imageDrag = useDraggablePosition(
    sideDesign.uploadedImagePosition,
    () => {},
  );

  return (
    <div
      ref={containerRef}
      className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 shadow-inner"
    >
      <div className="relative h-[85%] w-[85%]">
        {mockupImage ? (
          <Image
            src={mockupImage}
            alt={typeLabel}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Shirt className="h-24 w-24 text-ink-300" />
          </div>
        )}

        {showPrintArea && (
          <div className="pointer-events-none absolute inset-[12%] rounded-xl border-2 border-dashed border-brand-300/50" />
        )}

        {sideDesign.templateImage && (
          <div
            className="pointer-events-none absolute"
            style={{
              left: `${sideDesign.templatePosition.x}%`,
              top: `${sideDesign.templatePosition.y}%`,
              width: `${sideDesign.templateScale}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <img
              src={sideDesign.templateImage}
              alt=""
              className="block w-full object-contain"
            />
          </div>
        )}

        {sideDesign.uploadedFile?.isImage && sideDesign.uploadedFile.previewUrl && (
          <div
            ref={interactive ? imageDrag.ref : undefined}
            className={`absolute ${interactive ? 'cursor-move touch-none' : 'pointer-events-none'}`}
            style={{
              left: `${sideDesign.uploadedImagePosition.x}%`,
              top: `${sideDesign.uploadedImagePosition.y}%`,
              width: `${sideDesign.uploadedImageScale}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onPointerDown={interactive ? imageDrag.onPointerDown : undefined}
            onPointerMove={interactive ? imageDrag.onPointerMove : undefined}
            onPointerUp={interactive ? imageDrag.onPointerUp : undefined}
            onPointerCancel={interactive ? imageDrag.onPointerCancel : undefined}
          >
            <img
              src={sideDesign.uploadedFile.previewUrl}
              alt={sideDesign.uploadedFile.name}
              className="block w-full rounded-lg object-contain shadow-sm"
            />
          </div>
        )}

        {sideDesign.customText && (
          <div
            ref={interactive ? textDrag.ref : undefined}
            style={{
              color: sideDesign.customTextColor,
              left: `${sideDesign.customTextPosition.x}%`,
              top: `${sideDesign.customTextPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${sideDesign.customTextSize}px`,
              textShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }}
            className={`absolute max-w-[80%] select-none text-center font-semibold leading-tight ${interactive ? 'cursor-move touch-none' : 'pointer-events-none'}`}
            onPointerDown={interactive ? textDrag.onPointerDown : undefined}
            onPointerMove={interactive ? textDrag.onPointerMove : undefined}
            onPointerUp={interactive ? textDrag.onPointerUp : undefined}
            onPointerCancel={interactive ? textDrag.onPointerCancel : undefined}
          >
            {sideDesign.customText}
          </div>
        )}
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
  const { addItem } = useCart();
  const { token } = useUploadSession();

  const productId = searchParams.get('id');
  const designId = searchParams.get('design');

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
  const [size, setSize] = useState(product?.sizes?.[0] || 'M');
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
  const frontCaptureRef = useRef<HTMLDivElement | null>(null);
  const backCaptureRef = useRef<HTMLDivElement | null>(null);

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
    if (!designId) return;
    const template = getProductDesignTemplate(designId);
    if (!template) return;

    setSideDesigns((prev) => ({
      ...prev,
      [template.defaultSide]: {
        ...prev[template.defaultSide],
        templateImage: template.image,
        templateScale: template.scale ?? 45,
        templatePosition: template.position ?? { x: 50, y: 40 },
      },
    }));
    setActiveSide(template.defaultSide);
  }, [designId]);

  const mockupImage = product
    ? getProductMockup(product, color, activeSide)
    : '';

  async function capturePreview(
    ref: RefObject<HTMLDivElement | null>,
  ): Promise<string | undefined> {
    if (!ref.current) return undefined;
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: null,
        scale: window.devicePixelRatio || 1,
        useCORS: true,
      });
      return canvas.toDataURL('image/png');
    } catch {
      return undefined;
    }
  }

  async function handleAddToCart() {
    const frontPreview = hasTwoSides
      ? await capturePreview(frontCaptureRef)
      : await capturePreview(previewRef);
    const backPreview = hasTwoSides
      ? await capturePreview(backCaptureRef)
      : undefined;

    const metadata: Record<string, string | number | boolean> = {
      productId: product?.id ?? '',
      color,
      size,
      activeSide,
    };

    for (const side of sides) {
      const d = sideDesigns[side];
      const prefix = side === 'front' ? 'front' : 'back';
      metadata[`${prefix}CustomText`] = d.customText;
      metadata[`${prefix}CustomTextColor`] = d.customTextColor;
      metadata[`${prefix}CustomTextSize`] = d.customTextSize;
      metadata[`${prefix}CustomTextPositionX`] = d.customTextPosition.x;
      metadata[`${prefix}CustomTextPositionY`] = d.customTextPosition.y;
      metadata[`${prefix}UploadedImageScale`] = d.uploadedImageScale;
      metadata[`${prefix}UploadedImagePositionX`] = d.uploadedImagePosition.x;
      metadata[`${prefix}UploadedImagePositionY`] = d.uploadedImagePosition.y;
      metadata[`${prefix}TemplateScale`] = d.templateScale;
      metadata[`${prefix}TemplatePositionX`] = d.templatePosition.x;
      metadata[`${prefix}TemplatePositionY`] = d.templatePosition.y;
      if (d.templateImage) metadata[`${prefix}TemplateImage`] = d.templateImage;
    }

    if (designId) metadata.designTemplateId = designId;

    const fileIds = sides
      .map((s) => sideDesigns[s].uploadedFile?.fileId)
      .filter((id): id is string => Boolean(id));

    addItem({
      type: 'product',
      name: `${tp(type)} (${size})`,
      price: product?.basePrice ?? 0,
      quantity,
      designPreview: frontPreview,
      backDesignPreview: backPreview,
      metadata,
      fileIds,
    });
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
    } else if (currentDesign.templateImage) {
      updateCurrentSide({ templatePosition: positions[preset] });
    }
  }

  if (!product) {
    return <p>Product not found</p>;
  }

  const sideHasContent = (side: ProductSide) => {
    const d = sideDesigns[side];
    return Boolean(d.customText || d.uploadedFile || d.templateImage);
  };

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
              onTextPositionChange={(pos) =>
                updateCurrentSide({ customTextPosition: pos })
              }
              onImagePositionChange={(pos) =>
                updateCurrentSide({ uploadedImagePosition: pos })
              }
              onTemplatePositionChange={(pos) =>
                updateCurrentSide({ templatePosition: pos })
              }
            />
          </Card>

          <p className="text-center text-xs text-ink-500">{t('dragHint')}</p>

          {/* Hidden capture targets for both sides */}
          {hasTwoSides && (
            <div className="pointer-events-none fixed -left-[9999px] top-0 opacity-0">
              {sides.map((side) => (
                <div
                  key={side}
                  ref={side === 'front' ? frontCaptureRef : backCaptureRef}
                >
                  <ProductPreview
                    mockupImage={getProductMockup(product, color, side)}
                    sideDesign={sideDesigns[side]}
                    typeLabel={tp(type)}
                  />
                </div>
              ))}
            </div>
          )}
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
            onAddToCart={handleAddToCart}
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
          <Button size="sm" onClick={handleAddToCart} className="shrink-0">
            {t('addToCart')}
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

function InteractivePreview({
  mockupImage,
  sideDesign,
  typeLabel,
  containerRef,
  onTextPositionChange,
  onImagePositionChange,
  onTemplatePositionChange,
}: {
  mockupImage: string;
  sideDesign: SideDesign;
  typeLabel: string;
  containerRef: RefObject<HTMLDivElement | null>;
  onTextPositionChange: (pos: { x: number; y: number }) => void;
  onImagePositionChange: (pos: { x: number; y: number }) => void;
  onTemplatePositionChange: (pos: { x: number; y: number }) => void;
}) {
  const textDrag = useDraggablePosition(
    sideDesign.customTextPosition,
    onTextPositionChange,
  );
  const imageDrag = useDraggablePosition(
    sideDesign.uploadedImagePosition,
    onImagePositionChange,
  );
  const templateDrag = useDraggablePosition(
    sideDesign.templatePosition,
    onTemplatePositionChange,
  );

  return (
    <div
      ref={containerRef}
      className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 shadow-inner"
    >
      <div className="relative h-[85%] w-[85%]">
        {mockupImage ? (
          <Image
            src={mockupImage}
            alt={typeLabel}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-contain"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Shirt className="h-24 w-24 text-ink-300" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-[12%] rounded-xl border-2 border-dashed border-brand-300/40" />

        {sideDesign.templateImage && (
          <div
            ref={templateDrag.ref}
            className="absolute cursor-move touch-none"
            style={{
              left: `${sideDesign.templatePosition.x}%`,
              top: `${sideDesign.templatePosition.y}%`,
              width: `${sideDesign.templateScale}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onPointerDown={templateDrag.onPointerDown}
            onPointerMove={templateDrag.onPointerMove}
            onPointerUp={templateDrag.onPointerUp}
            onPointerCancel={templateDrag.onPointerCancel}
          >
            <img
              src={sideDesign.templateImage}
              alt=""
              className="block w-full object-contain"
            />
          </div>
        )}

        {sideDesign.uploadedFile?.isImage &&
          sideDesign.uploadedFile.previewUrl && (
            <div
              ref={imageDrag.ref}
              className="absolute cursor-move touch-none"
              style={{
                left: `${sideDesign.uploadedImagePosition.x}%`,
                top: `${sideDesign.uploadedImagePosition.y}%`,
                width: `${sideDesign.uploadedImageScale}%`,
                transform: 'translate(-50%, -50%)',
              }}
              onPointerDown={imageDrag.onPointerDown}
              onPointerMove={imageDrag.onPointerMove}
              onPointerUp={imageDrag.onPointerUp}
              onPointerCancel={imageDrag.onPointerCancel}
            >
              <img
                src={sideDesign.uploadedFile.previewUrl}
                alt={sideDesign.uploadedFile.name}
                className="block w-full rounded-lg object-contain shadow-sm"
              />
            </div>
          )}

        {sideDesign.customText && (
          <div
            ref={textDrag.ref}
            style={{
              color: sideDesign.customTextColor,
              left: `${sideDesign.customTextPosition.x}%`,
              top: `${sideDesign.customTextPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${sideDesign.customTextSize}px`,
              textShadow: '0 1px 4px rgba(0,0,0,0.25)',
            }}
            className="absolute max-w-[80%] cursor-move touch-none select-none text-center font-semibold leading-tight"
            onPointerDown={textDrag.onPointerDown}
            onPointerMove={textDrag.onPointerMove}
            onPointerUp={textDrag.onPointerUp}
            onPointerCancel={textDrag.onPointerCancel}
          >
            {sideDesign.customText}
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
}: {
  panel: EditorPanel;
  currentDesign: SideDesign;
  updateCurrentSide: (u: Partial<SideDesign>) => void;
  setPositionPreset: (p: 'center' | 'top' | 'bottom') => void;
  token: string | null;
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
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-600">{t('imageSize')}</span>
              <StepperInput
                value={currentDesign.uploadedImageScale}
                onChange={(v) => updateCurrentSide({ uploadedImageScale: v })}
                min={20}
                max={120}
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
          <>
            <p className="text-sm text-ink-600">
              {t('photoUploadInstructions')}
            </p>
            <SecureUpload
              token={token}
              onUpload={(fileId, name) => {
                updateCurrentSide({
                  uploadedFile: {
                    fileId,
                    name,
                    isImage: isImageFile(name),
                    previewUrl: isImageFile(name)
                      ? `/api/files/${fileId}`
                      : undefined,
                  },
                });
              }}
            />
          </>
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
  onAddToCart,
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
  onAddToCart: () => void;
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
          />
        </Card>
      )}

      {currentDesign.templateImage && !activePanel && (
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-600">{t('designSize')}</span>
            <StepperInput
              value={currentDesign.templateScale}
              onChange={(v) => updateCurrentSide({ templateScale: v })}
              min={20}
              max={100}
              step={5}
            />
          </div>
          <div className="mt-3">
            <PositionPresets onPreset={setPositionPreset} />
          </div>
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

      <Button size="lg" onClick={onAddToCart} className="w-full">
        {t('addToCart')} —{' '}
        {formatPrice(product.basePrice * quantity, locale)}
      </Button>
    </>
  );
}
