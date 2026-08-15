'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  products,
  getMagnetDisplayMockup,
} from '@/lib/data/catalog';
import type { UploadOnlyProductType } from '@/lib/products/upload-only-products';
import { withVendorSkuMetadata } from '@/lib/products/vendor-sku';
import { useCart } from '@/components/cart/CartProvider';
import { useUploadSessionGate } from '@/hooks/useUploadSessionGate';
import { ProductPhotoUpload } from '@/components/products/ProductPhotoUpload';
import { ProductImageCarousel } from '@/components/products/ProductImageCarousel';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { evaluateCartAssetLimits } from '@/lib/orders/order-assets';
import { productTypeHref } from '@/lib/products/product-nav';

type UploadedPhoto = {
  fileId: string;
  name: string;
  previewUrl: string;
};

type PhotoUploadOrderFormProps = {
  productType: UploadOnlyProductType;
};

export function PhotoUploadOrderForm({ productType }: PhotoUploadOrderFormProps) {
  const t = useTranslations('products.uploadOrder');
  const ti = useTranslations('products.items');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem, updateItem, items: cartItems } = useCart();
  const {
    token,
    loading: uploadLoading,
    error: uploadError,
    pendingTurnstile,
    setTurnstileToken,
    refreshSession,
  } = useUploadSessionGate();

  const productId = searchParams.get('id');
  const editCartItemId = searchParams.get('edit');
  const colorParam = searchParams.get('color');

  const product = useMemo(
    () => products.find((p) => p.id === productId && p.type === productType),
    [productId, productType],
  );

  const editingItem = useMemo(
    () =>
      editCartItemId
        ? cartItems.find((item) => item.id === editCartItemId)
        : undefined,
    [editCartItemId, cartItems],
  );

  const resolvedColor = useMemo(() => {
    if (!product) return '#ffffff';
    const fromEdit = editingItem?.metadata?.color;
    const raw =
      typeof fromEdit === 'string'
        ? fromEdit
        : colorParam ?? product.colors?.[0] ?? '#ffffff';
    return (
      product.colors?.find((c) => c.toLowerCase() === raw.toLowerCase()) ??
      product.colors?.[0] ??
      raw
    );
  }, [product, editingItem, colorParam]);

  const [quantity, setQuantity] = useState(editingItem?.quantity ?? 1);
  const [uploadedPhoto, setUploadedPhoto] = useState<UploadedPhoto | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingItem) return;
    const fileId = editingItem.metadata?.frontUploadedFileId;
    const previewUrl = editingItem.metadata?.frontUploadedPreviewUrl;
    if (typeof fileId === 'string' && typeof previewUrl === 'string') {
      setUploadedPhoto({
        fileId,
        name: 'upload-photo.jpg',
        previewUrl,
      });
    }
  }, [editingItem]);

  if (!product) {
    return (
      <Card className="p-8 text-center">
        <p className="text-ink-600">{t('notFound')}</p>
        <Link href={productTypeHref(productType)} className="mt-4 inline-block">
          <Button variant="outline">{t('backToCatalog')}</Button>
        </Link>
      </Card>
    );
  }

  const productLabel = product.nameKey
    ? ti(product.nameKey)
    : product.type;
  const mockupImage = getMagnetDisplayMockup(product, resolvedColor);

  function handleAddToCart() {
    if (!product) return;

    if (!uploadedPhoto) {
      setSubmitError(t('uploadRequired'));
      return;
    }

    const limits = evaluateCartAssetLimits(cartItems, {
      stickerCount: 0,
      photoCount: 1,
      excludingItemId: editCartItemId ?? undefined,
    });

    if (!limits.ok) {
      setSubmitError(t('photoLimit'));
      return;
    }

    setSubmitError(null);

    const metadata = withVendorSkuMetadata(
      {
        productId: product.id,
        color: resolvedColor,
        isUploadOrder: true,
        isCustomized: true,
        frontUploadedFileId: uploadedPhoto.fileId,
        frontUploadedPreviewUrl: uploadedPhoto.previewUrl,
        ...(productType === 'magnet' ? { isMagnetOrder: true } : {}),
      },
      product,
    );

    const payload = {
      type: 'product' as const,
      name: productLabel,
      price: product.basePrice,
      quantity,
      designPreview: mockupImage,
      fileIds: [uploadedPhoto.fileId],
      metadata,
    };

    if (editCartItemId) {
      updateItem(editCartItemId, payload);
    } else {
      addItem(payload);
    }

    router.push('/cart');
  }

  return (
    <div className="space-y-6">
      <Link
        href={`/products/${product.id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToProduct')}
      </Link>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
        <Card className="order-2 flex flex-col items-center p-4 lg:order-none lg:p-6">
          <p className="mb-3 text-sm font-medium text-ink-500 lg:mb-4">
            {t('productPreview')}
          </p>
          <div className="w-full max-w-[min(100%,16rem)] lg:max-w-none">
            <ProductImageCarousel
              product={product}
              color={resolvedColor}
              typeLabel={productLabel}
            />
          </div>
        </Card>

        <div className="order-1 space-y-6 lg:order-none">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">{productLabel}</h2>
            <p className="mt-1 text-lg text-brand-600">
              {formatPrice(product.basePrice, locale)}
            </p>
            <p className="mt-3 text-sm text-ink-600">{t('instructions')}</p>
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-ink-900">{t('uploadTitle')}</h3>
            <p className="mt-1 text-sm text-ink-500">{t('uploadHint')}</p>

            {uploadedPhoto?.previewUrl ? (
              <div className="mt-4 flex justify-center">
                <div className="relative aspect-square w-full max-w-[200px] overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
                  <Image
                    src={uploadedPhoto.previewUrl}
                    alt={t('yourImage')}
                    fill
                    sizes="200px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              <ProductPhotoUpload
                token={token}
                uploadLoading={uploadLoading}
                uploadError={uploadError}
                refreshSession={refreshSession}
                pendingTurnstile={pendingTurnstile}
                onTurnstileToken={setTurnstileToken}
                hasPhoto={Boolean(uploadedPhoto)}
                previewUrl={uploadedPhoto?.previewUrl}
                cropAspect={product.uploadAspect}
                onUploadComplete={(fileId, name, previewUrl) => {
                  setUploadedPhoto({ fileId, name, previewUrl });
                  setSubmitError(null);
                }}
              />
            </div>

            {uploadedPhoto ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 text-ink-500"
                onClick={() => setUploadedPhoto(null)}
              >
                {t('removeImage')}
              </Button>
            ) : null}
          </Card>

          <Card className="p-5">
            <label className="mb-3 block text-sm font-medium text-ink-700">
              {t('quantity')}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-300 text-lg"
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-lg font-medium">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-300 text-lg"
              >
                +
              </button>
            </div>
          </Card>

        </div>
      </div>

      <div
        className="sticky bottom-0 z-10 -mx-4 space-y-2 border-t border-ink-100 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-sm sm:-mx-0 sm:rounded-xl sm:border sm:shadow-sm sm:py-4"
      >
        {submitError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </p>
        ) : null}
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleAddToCart}
          disabled={!uploadedPhoto}
        >
          <ShoppingCart className="h-5 w-5" />
          {editCartItemId ? t('updateCart') : t('addToCart')}
        </Button>
      </div>
    </div>
  );
}
