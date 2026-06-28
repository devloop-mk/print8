'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  productNavCategories,
  productCategoryHref,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import { Reveal } from '@/components/motion/Reveal';

const SLIDE_INTERVAL_MS = 1400;

const categoryMeta: Record<
  ProductNavCategoryId,
  { images: string[]; accent: string }
> = {
  apparel: {
    images: [
      '/hoodies/hoodie-charcoal.jpg',
      '/t-shirts/tshirt-white.jpg',
      '/spikozni/mockup-bodysuit-white.png',
      '/caps/cap-charcoal-front.jpg',
    ],
    accent: 'from-brand-900/80',
  },
  drinkware: {
    images: [
      '/mugs/mug-milkyblue.jpg',
      '/thermoses/thermos-blue.jpg',
      '/cups/cup-glass-beer.jpg',
      '/mugs/mug-heart-handle.jpg',
    ],
    accent: 'from-sky-900/80',
  },
  bags: {
    images: ['/bags/bag-beige.jpg', '/bags/bag-beige-back.jpg'],
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

function ProductCategoryCard({
  categoryId,
  title,
  subtitle,
}: {
  categoryId: ProductNavCategoryId;
  title: string;
  subtitle: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const meta = categoryMeta[categoryId];

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'surface-panel relative flex h-full flex-col overflow-hidden transition-transform duration-300',
        isHovered && 'z-10 -translate-y-1.5',
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
          <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-sm leading-relaxed text-ink-600">{subtitle}</p>
        <p className="mt-4 text-sm font-semibold text-brand-600">→</p>
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

export function ProductsCategoryHub() {
  const tNav = useTranslations('nav.productsMenu.categories');
  const tc = useTranslations('products.categoryPages');

  return (
    <Reveal>
      <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {productNavCategories.map((category) => (
          <ProductCategoryCard
            key={category.id}
            categoryId={category.id}
            title={tNav(category.id)}
            subtitle={tc(`${category.id}.subtitle`)}
          />
        ))}
      </div>
    </Reveal>
  );
}
