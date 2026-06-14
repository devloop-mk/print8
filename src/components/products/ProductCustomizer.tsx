'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import html2canvas from 'html2canvas';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { products } from '@/lib/data/catalog';
import { useCart } from '@/components/cart/CartProvider';
import { useUploadSession } from '@/hooks/useUploadSession';
import { SecureUpload } from '@/components/upload/SecureUpload';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import type { ProductType } from '@/lib/data/catalog';
import { Shirt } from 'lucide-react';

export function ProductCustomizer({ type }: { type: ProductType }) {
  const t = useTranslations('products.customizer');
  const tp = useTranslations('products.types');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { token } = useUploadSession();

  const productId = searchParams.get('id');
  const product = useMemo(
    () =>
      products.find((p) => p.id === productId) ||
      products.find((p) => p.type === type),
    [productId, type],
  );

  const [color, setColor] = useState(product?.colors?.[0] || '#ffffff');
  const [size, setSize] = useState(product?.sizes?.[0] || 'M');
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState('');
  const [customTextColor, setCustomTextColor] = useState('#000000');
  const [customTextSize, setCustomTextSize] = useState(18);
  const [customTextPosition, setCustomTextPosition] = useState({
    x: 50,
    y: 25,
  });
  const [showTextCustomizer, setShowTextCustomizer] = useState(false);
  const [showPhotoCustomizer, setShowPhotoCustomizer] = useState(false);
  const [dragPosition, setDragPosition] = useState<{
    startX: number;
    startY: number;
  } | null>(null);
  const [uploadedImageScale, setUploadedImageScale] = useState(80);
  const [uploadedImagePosition, setUploadedImagePosition] = useState({
    x: 50,
    y: 50,
  });
  const dragPointerId = useRef<number | null>(null);
  const customTextRef = useRef<HTMLDivElement | null>(null);
  const textCustomizerRef = useRef<HTMLDivElement | null>(null);
  const photoCustomizerRef = useRef<HTMLDivElement | null>(null);
    const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    fileId: string;
    name: string;
    previewUrl?: string;
    isImage?: boolean;
  } | null>(null);

  const selectedImage = useMemo(
    () => product?.colorsImages?.[color] ?? product?.image ?? '',
    [product, color],
  );

  const isImageFile = (fileName: string) =>
    /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(fileName);

  if (!product) {
    return <p>Product not found</p>;
  }
  async function generatePreviewImage(): Promise<string | undefined> {
    if (!previewContainerRef.current) return undefined;
    try {
      const node = previewContainerRef.current;
      const canvas = await html2canvas(node, {
        backgroundColor: null,
        scale: window.devicePixelRatio || 1,
        useCORS: true,
      });
      return canvas.toDataURL('image/png');
    } catch (e) {
      // fallback: return undefined
      return undefined;
    }
  }


  async function handleAddToCart() {
    const preview = await generatePreviewImage();
    addItem({
      type: 'product',
      name: `${tp(type)} (${size})`,
      price: product?.basePrice ?? 0,
      quantity,
      designPreview: preview,
      metadata: {
        productId: product?.id ?? '',
        color,
        size,
        customText,
        customTextColor,
        customTextSize,
        customTextPositionX: customTextPosition.x,
        customTextPositionY: customTextPosition.y,
        uploadedImageScale,
        uploadedImagePositionX: uploadedImagePosition.x,
        uploadedImagePositionY: uploadedImagePosition.y,
      },
      fileIds: uploadedFile ? [uploadedFile.fileId] : [],
    });
    router.push('/cart');
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="flex aspect-square items-center justify-center">
        <div
                    ref={previewContainerRef}
          className="relative flex h-80 w-80 items-center justify-center rounded-2xl shadow-inner transition-colors"
          style={{ backgroundColor: product.colorsImages ? undefined : color }}
        >
          {selectedImage ? (
            <div className="relative h-64 w-64">
              <Image
                src={selectedImage}
                alt={tp(type)}
                fill
                sizes="256px"
                className="object-contain"
              />
              {uploadedFile &&
                uploadedFile.isImage &&
                uploadedFile.previewUrl && (
                  <div
                    className="pointer-events-none absolute"
                    style={{
                      left: `${uploadedImagePosition.x}%`,
                      top: `${uploadedImagePosition.y}%`,
                      width: `${uploadedImageScale}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <img
                      src={uploadedFile.previewUrl}
                      alt={uploadedFile.name}
                      className="block w-full max-w-full rounded-xl object-contain"
                    />
                  </div>
                )}
              {customText && (
                <div
                  ref={customTextRef}
                  style={{
                    color: customTextColor,
                    left: `${customTextPosition.x}%`,
                    top: `${customTextPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${customTextSize}px`,
                    textShadow: '0 0 6px rgba(0,0,0,0.22)',
                  }}
                  className="absolute cursor-move select-none font-semibold text-center"
                  onPointerDown={(event) => {
                    dragPointerId.current = event.pointerId;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    setDragPosition({
                      startX: event.clientX,
                      startY: event.clientY,
                    });
                  }}
                  onPointerMove={(event) => {
                    if (
                      !dragPosition ||
                      dragPointerId.current !== event.pointerId
                    )
                      return;
                    const deltaX = event.clientX - dragPosition.startX;
                    const deltaY = event.clientY - dragPosition.startY;
                    const parent = customTextRef.current?.parentElement;
                    if (!parent) return;
                    const parentRect = parent.getBoundingClientRect();
                    const currentX =
                      (customTextPosition.x / 100) * parentRect.width;
                    const currentY =
                      (customTextPosition.y / 100) * parentRect.height;
                    const nextX = Math.min(
                      Math.max(currentX + deltaX, 0),
                      parentRect.width,
                    );
                    const nextY = Math.min(
                      Math.max(currentY + deltaY, 0),
                      parentRect.height,
                    );
                    setCustomTextPosition({
                      x: (nextX / parentRect.width) * 100,
                      y: (nextY / parentRect.height) * 100,
                    });
                    setDragPosition({
                      startX: event.clientX,
                      startY: event.clientY,
                    });
                  }}
                  onPointerUp={(event) => {
                    if (dragPointerId.current === event.pointerId) {
                      event.currentTarget.releasePointerCapture(
                        event.pointerId,
                      );
                      dragPointerId.current = null;
                      setDragPosition(null);
                    }
                  }}
                  onPointerCancel={(event) => {
                    if (dragPointerId.current === event.pointerId) {
                      event.currentTarget.releasePointerCapture(
                        event.pointerId,
                      );
                      dragPointerId.current = null;
                      setDragPosition(null);
                    }
                  }}
                >
                  {customText}
                </div>
              )}
              {uploadedFile &&
                (!uploadedFile.isImage || !uploadedFile.previewUrl) && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-6 mb-6 rounded-2xl bg-white/80 px-3 py-2 text-center text-xs font-medium text-ink-700 shadow-lg backdrop-blur-sm">
                    ✓ {uploadedFile.name}
                  </div>
                )}
            </div>
          ) : (
            <Shirt className="h-32 w-32 text-ink-400" />
          )}
        </div>
      </Card>
      {showTextCustomizer && (
        <Card ref={textCustomizerRef}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink-900">
              {customText ? t('editText') : t('addText')}
            </h3>
            <button
              type="button"
              onClick={() => setShowTextCustomizer(false)}
              className="rounded-full border border-ink-200 bg-white px-3 py-1 text-sm text-ink-600 transition hover:bg-ink-50"
              aria-label={t('close')}
            >
              ×
            </button>
          </div>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-900 h-10"
            placeholder={t('addText')}
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex flex-1 flex-col gap-2 text-sm text-ink-700">
              <span>{t('textSize')}</span>
              <input
                type="range"
                min={12}
                max={60}
                value={customTextSize}
                onChange={(e) => setCustomTextSize(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-ink-300 bg-white px-2"
              />
            </label>
            <div className="flex flex-1 flex-col gap-2 text-sm text-ink-700">
              <span>{t('textPosition')}</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={customTextPosition.x}
                  onChange={(e) =>
                    setCustomTextPosition((prev) => ({
                      ...prev,
                      x: Number(e.target.value),
                    }))
                  }
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={customTextPosition.y}
                  onChange={(e) =>
                    setCustomTextPosition((prev) => ({
                      ...prev,
                      y: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <label className="flex flex-1 flex-col gap-2 text-sm text-ink-700">
              <span>{t('textColor')}</span>
              <input
                type="color"
                value={customTextColor}
                onChange={(e) => setCustomTextColor(e.target.value)}
                className="h-10 w-full rounded-lg border border-ink-300 bg-white px-1"
              />
            </label>
            <button
              type="button"
              className="self-end rounded-lg bg-ink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700"
              onClick={() => {
                setShowTextCustomizer(false);
              }}
            >
              {t('close')}
            </button>
          </div>
        </Card>
      )}
      {showPhotoCustomizer && (
        <Card ref={photoCustomizerRef}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-ink-900">
              {uploadedFile ? t('editPhoto') : t('addPhoto')}
            </h3>
            <button
              type="button"
              onClick={() => setShowPhotoCustomizer(false)}
              className="rounded-full border border-ink-200 bg-white px-3 py-1 text-sm text-ink-600 transition hover:bg-ink-50"
              aria-label={t('close')}
            >
              ×
            </button>
          </div>

          {uploadedFile ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
                <p className="font-medium text-ink-900">{uploadedFile.name}</p>
                <p>{t('uploadDesign')}</p>
              </div>

              {uploadedFile.isImage && uploadedFile.previewUrl ? (
                <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
                  <img
                    src={uploadedFile.previewUrl}
                    alt={uploadedFile.name}
                    className="h-40 w-full object-contain"
                  />
                </div>
              ) : (
                <p className="text-sm text-ink-600">
                  {uploadedFile.isImage
                    ? t('previewNotAvailable')
                    : t('fileUploaded')}
                </p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2 text-sm text-ink-700">
                  <span>{t('imageSize')}</span>
                  <input
                    type="range"
                    min={20}
                    max={150}
                    value={uploadedImageScale}
                    onChange={(e) =>
                      setUploadedImageScale(Number(e.target.value))
                    }
                  />
                </div>
                <div className="flex flex-col gap-2 text-sm text-ink-700">
                  <span>{t('imagePosition')}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={uploadedImagePosition.x}
                      onChange={(e) =>
                        setUploadedImagePosition((prev) => ({
                          ...prev,
                          x: Number(e.target.value),
                        }))
                      }
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={uploadedImagePosition.y}
                      onChange={(e) =>
                        setUploadedImagePosition((prev) => ({
                          ...prev,
                          y: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setUploadedFile(null)}
              >
                {t('removePhoto')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-ink-600">
                {t('photoUploadInstructions')}
              </p>
              <SecureUpload
                token={token}
                onUpload={(fileId, name) => {
                  setUploadedFile({
                    fileId,
                    name,
                    isImage: isImageFile(name),
                    previewUrl: isImageFile(name)
                      ? `/api/files/${fileId}`
                      : undefined,
                  });
                }}
              />
            </div>
          )}
        </Card>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">{tp(type)}</h2>
          <p className="mt-1 text-lg text-brand-600">
            {formatPrice(product.basePrice, locale)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!showTextCustomizer && (
            <button
              type="button"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              onClick={() => {
                setShowTextCustomizer(true);
                setShowPhotoCustomizer(false);
                setTimeout(() => {
                  textCustomizerRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                  });
                }, 100);
              }}
            >
              {customText ? t('editText') : t('addText')}
            </button>
          )}
          {!showPhotoCustomizer && (
            <button
              type="button"
              className="rounded-lg bg-ink-100 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-200"
              onClick={() => {
                setShowPhotoCustomizer(true);
                setShowTextCustomizer(false);
                setTimeout(() => {
                  photoCustomizerRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                  });
                }, 100);
              }}
            >
              {uploadedFile ? t('editPhoto') : t('addPhoto')}
            </button>
          )}
        </div>

        {product.colors && (
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">
              {t('selectColor')}
            </label>
            <div className="flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-10 w-10 rounded-full border-2 transition ${
                    color === c
                      ? 'border-brand-600 ring-2 ring-brand-200'
                      : 'border-ink-200'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
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
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    size === s
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
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
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-24 rounded-lg border border-ink-300 px-3 py-2"
          />
        </div>

        <Button
          size="lg"
          onClick={handleAddToCart}
          className="w-full"
        >
          Add to cart — {formatPrice(product.basePrice * quantity, locale)}
        </Button>
      </div>
    </div>
  );
}
