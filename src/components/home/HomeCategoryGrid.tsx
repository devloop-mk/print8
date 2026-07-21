'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  productCategoryHref,
  productTypeHref,
} from '@/lib/products/product-nav';
import type { ProductType } from '@/lib/data/catalog';

type CategoryTile =
  | {
      id: string;
      kind: 'type';
      type: ProductType;
      image: string;
      imageClassName?: string;
    }
  | {
      id: string;
      kind: 'category';
      categoryId: 'bags' | 'gifts';
      image: string;
      imageClassName?: string;
    };

const categoryTiles: CategoryTile[] = [
  {
    id: 't-shirt',
    kind: 'type',
    type: 't-shirt',
    image: '/t-shirts/unisex/bela-front.jpg',
  },
  {
    id: 'bag',
    kind: 'category',
    categoryId: 'bags',
    image: '/bags/bag-beige.jpg',
  },
  {
    id: 'mug',
    kind: 'type',
    type: 'mug',
    image: '/mugs/mug-milkyblue.jpg',
  },
  {
    id: 'hoodie',
    kind: 'type',
    type: 'hoodie',
    image: '/hoodies/hoodie-charcoal.jpg',
  },
  {
    id: 'cap',
    kind: 'type',
    type: 'cap',
    image: '/caps/cap-charcoal-front.jpg',
  },
  {
    id: 'gifts',
    kind: 'category',
    categoryId: 'gifts',
    image: '/magnets/magnet-ceramic-heart.jpg',
  },
  {
    id: 'thermos',
    kind: 'type',
    type: 'thermos',
    image: '/thermoses/thermos-blue.jpg',
  },
  {
    id: 'bodysuit',
    kind: 'type',
    type: 'bodysuit',
    image: '/spikozni/mockup-bodysuit-white.png',
  },
];

function tileHref(tile: CategoryTile): string {
  if (tile.kind === 'type') return productTypeHref(tile.type);
  return productCategoryHref(tile.categoryId);
}

function tileLabelKey(tile: CategoryTile): string {
  if (tile.kind === 'type') return tile.type;
  return tile.categoryId;
}

export function HomeCategoryGrid({ productCount }: { productCount: number }) {
  const t = useTranslations('home.categoryGrid');
  const tp = useTranslations('products.typesPlural');
  const tNav = useTranslations('home.categoryStrip.items');

  return (
    <section className="border-b border-ink-200/80 bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Link
            href="/products"
            className={cn(
              'group relative col-span-2 overflow-hidden rounded-2xl bg-ink-950 text-white',
              'flex min-h-[11.5rem] flex-col justify-between p-6 sm:min-h-[12.5rem] sm:p-8',
              'transition hover:-translate-y-0.5 hover:shadow-lift-lg',
              'lg:aspect-[2/1] lg:min-h-0',
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_0%_0%,rgba(59,130,246,0.22),transparent)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_100%_100%,rgba(59,130,246,0.12),transparent)]"
              aria-hidden
            />

            <div className="relative">
              <h2 className="font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-[2rem] lg:leading-[1.15]">
                {t('headline')}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-100/85 sm:text-base">
                {t('subcopy', { count: productCount })}
              </p>
            </div>

            <span
              className={cn(
                'relative mt-5 inline-flex w-fit items-center gap-2 rounded-lg border-2 border-brand-500',
                'bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white',
                'shadow-lift-brand transition group-hover:-translate-y-0.5 group-hover:from-brand-500 group-hover:to-brand-600',
              )}
            >
              {t('cta')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </Link>

          {categoryTiles.map((tile) => {
            const label =
              tile.kind === 'type'
                ? tp(tileLabelKey(tile) as ProductType)
                : tNav(tileLabelKey(tile));

            return (
              <Link
                key={tile.id}
                href={tileHref(tile)}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-2xl bg-white',
                  'border border-ink-200/80 transition',
                  'hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift',
                )}
              >
                <Image
                  src={tile.image}
                  alt={label}
                  fill
                  sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
                  className={cn(
                    'object-contain p-3 pb-10 transition duration-300 group-hover:scale-[1.03]',
                    tile.imageClassName,
                  )}
                />
                <span className="absolute bottom-3 left-3 rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-ink-900 shadow-sm">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
