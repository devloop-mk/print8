'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  products,
  getProductDesignTemplatesByCategory,
} from '@/lib/data/catalog';
import { getProductOffering } from '@/lib/products/offering';
import { getProductPaths, PRODUCT_DESIGN_PREVIEW_LIMIT } from '@/lib/products/paths';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { ProductImageCarousel } from '@/components/products/ProductImageCarousel';
import { ProductPathChooser } from '@/components/products/ProductPathChooser';
import { ProductDesignSection } from '@/components/products/ProductDesignSection';
import { Reveal } from '@/components/motion/Reveal';
import { ArrowLeft, Palette, Sparkles, Type } from 'lucide-react';

export function ProductDetail({ productId }: { productId: string }) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');
  const locale = useLocale();

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [productId],
  );

  const [color, setColor] = useState(product?.colors?.[0] || '#ffffff');
  const [size, setSize] = useState(product?.sizes?.[0] ?? '');

  const offering = useMemo(
    () => (product ? getProductOffering(product) : null),
    [product],
  );

  const imageDesigns = useMemo(
    () =>
      product
        ? getProductDesignTemplatesByCategory(product, 'image-designs')
        : [],
    [product],
  );

  const textDesigns = useMemo(
    () =>
      product
        ? getProductDesignTemplatesByCategory(product, 'text-designs')
        : [],
    [product],
  );

  if (!product || !offering) {
    return <p>{td('notFound')}</p>;
  }

  const paths = getProductPaths(product.id, product.type, { color, size });

  function scrollToDesigns(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  const quickDesignSection = offering.hasPhotoDesigns
    ? 'photo-designs'
    : offering.hasTextTemplates
      ? 'text-designs'
      : null;

  return (
    <div className="space-y-10 pb-24 lg:pb-0">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {td('backToProducts')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <Reveal>
          <Card className="flex flex-col items-center justify-center p-6">
            <p className="mb-4 text-sm font-medium text-ink-500">
              {td('blankProduct')}
            </p>
            <ProductImageCarousel
              product={product}
              color={color}
              typeLabel={tp(product.type)}
            />

            {product.colors && (
              <div className="mt-6 w-full max-w-sm">
                <label className="mb-2 block text-center text-sm font-medium text-ink-700">
                  {t('customizer.selectColor')}
                </label>
                <div className="flex justify-center gap-3">
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

        <Reveal delay={100}>
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-ink-900">
                {tp(product.type)}
              </h1>
              <p className="mt-2 text-xl text-brand-600">
                {t('startingFrom')} {formatPrice(product.basePrice, locale)}
              </p>
              <p className="mt-4 text-ink-600">{td('description')}</p>
            </div>

            {offering.hasPremade ? (
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {t('card.customOption')}
                </span>
                {offering.hasPhotoDesigns ? (
                  <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700">
                    {t('paths.countPhoto', { count: offering.imageDesignCount })}
                  </span>
                ) : null}
                {offering.hasTextTemplates ? (
                  <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-700">
                    {t('paths.countTemplate', {
                      count: offering.textDesignCount,
                    })}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>

      <ProductPathChooser
        productId={product.id}
        productType={product.type}
        offering={offering}
        color={color}
        size={size}
      />

      {offering.hasPremade ? (
        <div className="space-y-10">
          {imageDesigns.length > 0 && (
            <Reveal>
              <ProductDesignSection
                id="photo-designs"
                icon={<Sparkles className="h-6 w-6 text-brand-600" />}
                title={td('imageDesigns')}
                hint={td('imageDesignsHint')}
                product={product}
                color={color}
                size={size}
                designs={imageDesigns}
                limit={PRODUCT_DESIGN_PREVIEW_LIMIT}
                seeAllHref={
                  imageDesigns.length > PRODUCT_DESIGN_PREVIEW_LIMIT
                    ? paths.photoDesigns
                    : undefined
                }
                seeAllLabel={td('seeAllPhotoDesigns')}
              />
            </Reveal>
          )}

          {textDesigns.length > 0 && (
            <Reveal delay={80}>
              <ProductDesignSection
                id="text-designs"
                icon={<Type className="h-6 w-6 text-brand-600" />}
                title={td('textDesigns')}
                hint={td('textDesignsHint')}
                product={product}
                color={color}
                size={size}
                designs={textDesigns}
                limit={PRODUCT_DESIGN_PREVIEW_LIMIT}
                seeAllHref={
                  textDesigns.length > PRODUCT_DESIGN_PREVIEW_LIMIT
                    ? paths.textDesigns
                    : undefined
                }
                seeAllLabel={td('seeAllTextDesigns')}
              />
            </Reveal>
          )}
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto max-w-lg">
          {offering.hasPremade && quickDesignSection ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => scrollToDesigns(quickDesignSection)}
                className="inline-flex min-h-[3rem] items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                {offering.hasPhotoDesigns ? (
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                ) : (
                  <Type className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {td('mobileQuickOrder')}
              </button>
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
