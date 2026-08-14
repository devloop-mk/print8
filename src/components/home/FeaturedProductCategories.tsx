'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  productNavCategories,
  productCategoryHref,
  productTypeHref,
  getNavProductTypes,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import { useVisibleProductTypes } from '@/components/layout/ProductVisibilityProvider';
import { getProductTypeIcon } from '@/lib/products/product-type-icons';

const SLIDE_INTERVAL_MS = 1400;

const categoryMeta: Record<
  ProductNavCategoryId,
  { images: string[]; accent: string }
> = {
  apparel: {
    images: [
      '/hoodies/hoodie-charcoal.jpg',
      '/t-shirts/unisex/bela-front.jpg',
      '/spikozni/mockup-bodysuit-white.png',
      '/caps/cap-charcoal-front.jpg',
    ],
    accent: 'from-brand-900/80',
  },
  drinkware: {
    images: [
      '/mugs/mug-milkyblue.jpg',
      '/cups/cup-glass-beer.jpg',
      '/mugs/mug-heart-handle.jpg',
      '/mugs/mug-white-classic-v2.jpg',
    ],
    accent: 'from-sky-900/80',
  },
  bags: {
    images: ['/bags/bag-naturella-natural.jpg'],
    accent: 'from-amber-900/80',
  },
  gifts: {
    images: [
      '/magnets/magnet-ceramic-heart.jpg',
      '/magnets/magnet-glass-5x7.jpg',
      '/magnets/magnet-hardboard-round.jpg',
    ],
    accent: 'from-rose-900/80',
  },
};

function CategoryImageSlideshow({
  images,
  alt,
  accent,
  isActive,
}: {
  images: string[];
  alt: string;
  accent: string;
  isActive: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const canSlide = images.length > 1;

  useEffect(() => {
    if (!isActive || !canSlide) return;

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [isActive, canSlide, images.length]);

  useEffect(() => {
    if (!isActive) setActiveIndex(0);
  }, [isActive]);

  return (
    <div className="relative aspect-[16/10] overflow-hidden bg-ink-50">
      <div
        className={cn(
          'flex h-full transition-transform duration-700 ease-out',
          canSlide && isActive && 'will-change-transform',
        )}
        style={{
          transform: canSlide
            ? `translateX(-${activeIndex * 100}%)`
            : undefined,
        }}
      >
        {images.map((src) => (
          <div key={src} className="relative min-w-full shrink-0">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain p-6 pb-14"
            />
          </div>
        ))}
      </div>

      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t to-transparent',
          accent,
        )}
        aria-hidden
      />

      <div
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-300',
          isActive
            ? 'opacity-100 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.35)]'
            : 'opacity-0',
        )}
        aria-hidden
      />

      {canSlide ? (
        <div
          className="pointer-events-none absolute bottom-14 left-4 flex gap-1.5"
          aria-hidden
        >
          {images.map((src, index) => (
            <span
              key={src}
              className={cn(
                'h-1.5 rounded-full bg-white/40 transition-all duration-300',
                index === activeIndex ? 'w-4 bg-white' : 'w-1.5',
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FeaturedProductCategories() {
  const tNav = useTranslations('nav.productsMenu.categories');
  const tc = useTranslations('products.categoryPages');
  const tp = useTranslations('products.typesPlural');
  const t = useTranslations('home.featuredCategories');
  const visibleProductTypes = useVisibleProductTypes();
  const visibleTypeSet = visibleProductTypes
    ? new Set(visibleProductTypes)
    : null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {productNavCategories.map((category) => {
        const meta = categoryMeta[category.id];
        const types = getNavProductTypes(category.types).filter(
          (type) => !visibleTypeSet || visibleTypeSet.has(type),
        );

        return (
          <CategoryCard
            key={category.id}
            categoryId={category.id}
            types={types}
            meta={meta}
            title={tNav(category.id)}
            subtitle={tc(`${category.id}.subtitle`)}
            typesLabel={t('typesLabel')}
            typeLabel={(type) => tp(type)}
          />
        );
      })}
    </div>
  );
}

function CategoryCard({
  categoryId,
  types,
  meta,
  title,
  subtitle,
  typesLabel,
  typeLabel,
}: {
  categoryId: ProductNavCategoryId;
  types: (typeof productNavCategories)[number]['types'];
  meta: { images: string[]; accent: string };
  title: string;
  subtitle: string;
  typesLabel: string;
  typeLabel: (type: (typeof types)[number]) => string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'surface-panel relative flex h-full flex-col overflow-hidden transition-transform duration-300',
      )}
    >
      <div className="relative overflow-hidden">
        <CategoryImageSlideshow
          images={meta.images}
          alt={title}
          accent={meta.accent}
          isActive={isHovered}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5">
          <h3 className="text-lg font-bold text-white sm:text-xl">{title}</h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-sm leading-relaxed text-ink-600">{subtitle}</p>

        <div className="mt-4 border-t border-ink-100 pt-4">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            {typesLabel}
          </p>
          <div className="relative z-10 flex flex-wrap gap-2">
            {types.map((type) => {
              const TypeIcon = getProductTypeIcon(type);
              return (
                <Link
                  key={type}
                  href={productTypeHref(type)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  <TypeIcon className="h-3.5 w-3.5" aria-hidden />
                  {typeLabel(type)}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Link
        href={productCategoryHref(categoryId)}
        className="absolute inset-0 z-[1]"
        aria-label={title}
      >
        <span className="sr-only">{title}</span>
      </Link>
    </article>
  );
}
