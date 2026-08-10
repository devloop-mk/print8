'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { products } from '@/lib/data/catalog';
import { isUploadOnlyProduct } from '@/lib/products/upload-only-products';
import { getProductOffering } from '@/lib/products/offering';
import { getProductDisplayPrice } from '@/lib/products/tshirt-print-pricing';
import { getColorSwatchDisplayHex } from '@/lib/products/product-color-labels';
import {
  getProductPaths,
} from '@/lib/products/paths';
import { resolveProductId } from '@/lib/products/product-id-aliases';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { ProductImageCarousel } from '@/components/products/ProductImageCarousel';
import { ProductPathChooser } from '@/components/products/ProductPathChooser';
import { Reveal } from '@/components/motion/Reveal';
import { ArrowLeft, Palette, Sparkles, Upload } from 'lucide-react';

export function ProductDetail({ productId }: { productId: string }) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');
  const ti = useTranslations('products.items');
  const locale = useLocale();

  const product = useMemo(
    () => products.find((p) => p.id === resolveProductId(productId)),
    [productId],
  );

  const [color, setColor] = useState(product?.colors?.[0] || '#ffffff');
  const [size, setSize] = useState(product?.sizes?.[0] ?? '');

  const offering = useMemo(
    () => (product ? getProductOffering(product) : null),
    [product],
  );

  if (!product || !offering) {
    return <p>{td('notFound')}</p>;
  }

  const paths = getProductPaths(product.id, product.type, { color, size });
  const readyDesignsHref = paths.premadeDesigns;
  const productLabel = product.nameKey
    ? ti(product.nameKey)
    : tp(product.type);
  const isUpload = isUploadOnlyProduct(product);

  return (
    <div className="min-w-0 max-w-full space-y-10 pb-24 lg:pb-0">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {td('backToProducts')}
      </Link>

      <div className="grid min-w-0 gap-8 lg:grid-cols-2 lg:items-start">
        <Reveal className="min-w-0">
          <Card className="flex min-w-0 flex-col items-center justify-center overflow-x-clip p-6">
            <p className="mb-4 text-sm font-medium text-ink-500">
              {td('blankProduct')}
            </p>
            <ProductImageCarousel
              product={product}
              color={color}
              typeLabel={productLabel}
            />

            {product.colors && (
              <div className="mt-6 w-full max-w-sm">
                <label className="mb-2 block text-center text-sm font-medium text-ink-700">
                  {t('customizer.selectColor')}
                </label>
                <div className="flex flex-wrap justify-center gap-3">
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
                      style={{ backgroundColor: getColorSwatchDisplayHex(c) }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.sizes && (
              <div className="mt-4 w-full max-w-sm">
                <label className="mb-2 block text-center text-sm font-medium text-ink-700">
                  {t('customizer.selectSize')}
                </label>
                <div className="flex flex-wrap justify-center gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`min-h-10 min-w-10 rounded-lg px-3 py-1.5 text-sm font-medium ${
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
          </Card>
        </Reveal>

        <Reveal delay={100} className="min-w-0">
          <div className="flex min-w-0 flex-col gap-6 lg:min-h-full">
            <div>
              <h1 className="text-3xl font-bold text-ink-900">
                {productLabel}
              </h1>
              <p className="mt-2 text-xl text-brand-600">
                {t('startingFrom')} {formatPrice(getProductDisplayPrice(product), locale)}
              </p>
              <p className="mt-4 text-ink-600">
                {isUpload ? td('uploadDescription') : td('description')}
              </p>
            </div>

            {isUpload ? (
              <Link
                href={paths.custom}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white transition hover:bg-brand-700 sm:w-auto"
              >
                <Upload className="h-5 w-5" />
                {td('uploadCta')}
              </Link>
            ) : null}

            {!isUpload ? (
              <div className="lg:border-t lg:border-ink-200 lg:pt-6">
                <ProductPathChooser
                  productId={product.id}
                  productType={product.type}
                  offering={offering}
                  color={color}
                  size={size}
                  variant="sidebar"
                />
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-lg">
          {isUpload ? (
            <Link
              href={paths.custom}
              className="inline-flex w-full min-h-[3rem] items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white transition hover:bg-brand-700"
            >
              <Upload className="h-5 w-5" aria-hidden />
              {td('uploadCta')}
            </Link>
          ) : offering.hasPremade ? (
            <div className="grid min-w-0 grid-cols-2 gap-2">
              <Link
                href={readyDesignsHref}
                className="inline-flex min-h-[3rem] min-w-0 items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{td('mobileQuickOrder')}</span>
              </Link>
              <Link
                href={paths.custom}
                className="inline-flex min-h-[3rem] items-center justify-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-800 transition hover:bg-ink-50"
              >
                <Palette className="h-4 w-4 shrink-0" aria-hidden />
                {td('mobileDesignOwn')}
              </Link>
            </div>
          ) : (
            <Link
              href={paths.custom}
              className="inline-flex w-full min-h-[3rem] items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-base font-medium text-white transition hover:bg-brand-700"
            >
              <Palette className="h-5 w-5" aria-hidden />
              {t('customize')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
