'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  products,
  getProductDesignTemplatesByCategory,
  type ProductDesignCategory,
} from '@/lib/data/catalog';
import { getProductPaths } from '@/lib/products/paths';
import { formatPrice } from '@/lib/utils';
import { ProductDesignSection } from '@/components/products/ProductDesignSection';
import { Reveal } from '@/components/motion/Reveal';
import { ArrowLeft, Sparkles, Type } from 'lucide-react';

type ProductDesignsPageProps = {
  productId: string;
  category: ProductDesignCategory;
};

export function ProductDesignsPage({
  productId,
  category,
}: ProductDesignsPageProps) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');
  const locale = useLocale();

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [productId],
  );

  const [color, setColor] = useState(product?.colors?.[0] || '#ffffff');

  const designs = useMemo(
    () =>
      product ? getProductDesignTemplatesByCategory(product, category) : [],
    [product, category],
  );

  if (!product) {
    return <p>{td('notFound')}</p>;
  }

  const paths = getProductPaths(product.id, product.type);
  const isPhoto = category === 'image-designs';

  return (
    <div className="space-y-8">
      <Link
        href={paths.detail}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {td('backToProduct')}
      </Link>

      <Reveal>
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-600">{tp(product.type)}</p>
          <h1 className="mt-1 text-3xl font-bold text-ink-900">
            {isPhoto ? td('imageDesigns') : td('textDesigns')}
          </h1>
          <p className="mt-2 text-ink-600">
            {isPhoto ? td('imageDesignsHint') : td('textDesignsHint')}
          </p>
          <p className="mt-2 text-brand-600">
            {t('startingFrom')} {formatPrice(product.basePrice, locale)}
          </p>
        </div>
      </Reveal>

      {product.colors && product.colors.length > 0 ? (
        <Reveal delay={60}>
          <div className="rounded-xl border border-ink-200 bg-white p-4">
            <label className="mb-3 block text-sm font-medium text-ink-700">
              {t('customizer.selectColor')}
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
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </Reveal>
      ) : null}

      <Reveal delay={100}>
        <ProductDesignSection
          id={isPhoto ? 'photo-designs' : 'text-designs'}
          icon={
            isPhoto ? (
              <Sparkles className="h-6 w-6 text-brand-600" />
            ) : (
              <Type className="h-6 w-6 text-brand-600" />
            )
          }
          title={isPhoto ? td('imageDesigns') : td('textDesigns')}
          hint={isPhoto ? td('imageDesignsPageHint') : td('textDesignsPageHint')}
          product={product}
          color={color}
          designs={designs}
        />
      </Reveal>
    </div>
  );
}
