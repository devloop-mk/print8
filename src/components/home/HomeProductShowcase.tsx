'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import type { HomeShowcaseCategory } from '@/lib/home/featured-home-products';
import {
  productCategoryHref,
  productNavCategories,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import {
  getMockupImageDisplayStyle,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';

export function HomeProductShowcase({
  groups,
}: {
  groups: HomeShowcaseCategory[];
}) {
  const t = useTranslations('home.productShowcase');
  const tNav = useTranslations('home.categoryStrip.items');
  const tp = useTranslations('products.types');
  const ti = useTranslations('products.items');
  const tProducts = useTranslations('products');
  const locale = useLocale();

  const available = useMemo(
    () =>
      (Array.isArray(groups) ? groups : []).filter(
        (group) => group.products.length > 0,
      ),
    [groups],
  );

  const [activeId, setActiveId] = useState<ProductNavCategoryId | 'all'>('all');

  const visibleProducts = useMemo(() => {
    if (activeId === 'all') {
      // Keep the “all” grid short: two products from each category.
      return available.flatMap((group) =>
        group.products.slice(0, 2).map((product) => ({
          product,
          categoryId: group.id,
        })),
      );
    }
    const group = available.find((item) => item.id === activeId);
    return (group?.products ?? []).map((product) => ({
      product,
      categoryId: group!.id,
    }));
  }, [activeId, available]);

  if (available.length === 0) return null;

  return (
    <section className="border-b border-ink-200/80 bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600 sm:text-base">
              {t('subtitle')}
            </p>
          </div>
          <Link href="/products" className="link-cta shrink-0 self-start sm:self-auto">
            {t('viewAll')} →
          </Link>
        </div>

        <div
          className={cn(
            'mb-5 flex gap-2 overflow-x-auto pb-1',
            'snap-x snap-mandatory',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
          role="tablist"
          aria-label={t('filterLabel')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeId === 'all'}
            onClick={() => setActiveId('all')}
            className={cn(
              'shrink-0 snap-start border px-3 py-1.5 text-sm font-semibold transition',
              activeId === 'all'
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-ink-200 bg-ink-50 text-ink-700 hover:border-brand-400 hover:text-brand-800',
            )}
          >
            {t('all')}
          </button>
          {available.map((group) => (
            <button
              key={group.id}
              type="button"
              role="tab"
              aria-selected={activeId === group.id}
              onClick={() => setActiveId(group.id)}
              className={cn(
                'shrink-0 snap-start border px-3 py-1.5 text-sm font-semibold transition',
                activeId === group.id
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-ink-200 bg-ink-50 text-ink-700 hover:border-brand-400 hover:text-brand-800',
              )}
            >
              {tNav(group.id)}
            </button>
          ))}
        </div>

        <div
          className={cn(
            'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4',
          )}
        >
          {visibleProducts.map(({ product, categoryId }) => {
            const label = product.nameKey ? ti(product.nameKey) : tp(product.type);
            const mockupLayout = getProductMockupLayout(product);
            const image = product.image;

            return (
              <Link
                key={`${categoryId}-${product.id}`}
                href={`/products/${product.id}`}
                className="group flex flex-col border border-ink-200 bg-white transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift"
              >
                <div className="relative aspect-square overflow-hidden bg-ink-50">
                  {image ? (
                    <div className={mockupLayout.catalogInnerClass}>
                      <Image
                        src={image}
                        alt={label}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 45vw, 25vw"
                        className={mockupLayout.catalogImageClass}
                        style={getMockupImageDisplayStyle(product, image, 'catalog-card')}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col p-3 sm:p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    {tNav(categoryId)}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                    {label}
                  </p>
                  <p className="mt-1 text-sm text-brand-600">
                    {tProducts('startingFrom')} {formatPrice(product.basePrice, locale)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {activeId !== 'all' ? (
          <div className="mt-6 flex justify-center">
            <Link
              href={productCategoryHref(activeId)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:text-brand-800"
            >
              {t('seeCategory', { category: tNav(activeId) })}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {productNavCategories.map((category) => (
              <Link
                key={category.id}
                href={productCategoryHref(category.id)}
                className="text-sm font-semibold text-brand-700 transition hover:text-brand-800"
              >
                {tNav(category.id)} →
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
