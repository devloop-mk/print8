'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import type { ProductType } from '@/lib/data/catalog';
import {
  getProductTypeDesignCategories,
  resolveCategoryMockupPreview,
  type CategoryMockupPreview,
} from '@/lib/products/product-type-design-categories';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

type ProductTypeDesignCategoriesProps = {
  type: ProductType;
  /** Server-resolved mockups with admin overlay placement already applied. */
  categoryPreviews?: Record<string, CategoryMockupPreview>;
};

export function ProductTypeDesignCategories({
  type,
  categoryPreviews,
}: ProductTypeDesignCategoriesProps) {
  const t = useTranslations('products.typePages.designCategories');
  const tp = useTranslations('products.types');
  const categories = getProductTypeDesignCategories(type);

  if (categories.length === 0) return null;

  return (
    <Reveal delay={40} className="min-w-0">
      <div className="min-w-0 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold tracking-tight text-ink-900 sm:text-xl">
              {t('title')}
            </h3>
            <p className="mt-0.5 text-sm text-ink-500">{t('subtitle')}</p>
          </div>
        </div>

        <div className="relative min-w-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent sm:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent"
          />

          <ul
            className={cn(
              'flex gap-2.5 overflow-x-auto pb-1 pt-0.5 [contain:inline-size]',
              'snap-x snap-mandatory scroll-smooth',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
          >
            {categories.map((category) => {
              const title = t(`${category.id}.title`);
              const description = t(`${category.id}.description`);
              const rawPreview =
                categoryPreviews?.[category.id] ??
                resolveCategoryMockupPreview(category, type);
              const preview = rawPreview
                ? resolveCategoryMockupPreview(category, type, rawPreview.design)
                : null;

              return (
                <li
                  key={category.id}
                  className="w-[7.25rem] shrink-0 snap-start sm:w-[8.25rem]"
                >
                  <Link
                    href={category.href}
                    title={description}
                    className={cn(
                      'group relative block aspect-[3/4] overflow-hidden rounded-2xl',
                      'bg-ink-100 ring-1 ring-ink-200/80',
                      'transition duration-300',
                      'hover:ring-brand-400 hover:shadow-md',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    )}
                  >
                    <span className="absolute inset-0 origin-center transition duration-500 ease-out group-hover:scale-[1.06]">
                      {preview ? (
                        <DesignTemplatePreview
                          product={preview.product}
                          color={preview.color}
                          design={preview.design}
                          typeLabel={tp(preview.product.type)}
                          className="!aspect-auto h-full rounded-none border-0 bg-ink-100"
                        />
                      ) : (
                        <span className="block h-full w-full bg-ink-100" />
                      )}
                    </span>

                    <span
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/25 to-ink-950/5"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 bg-gradient-to-t from-brand-950/35 to-transparent"
                    />

                    <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-1.5 p-2.5 sm:p-3">
                      <span className="min-w-0 text-[13px] font-semibold leading-snug text-white drop-shadow-sm">
                        {title}
                      </span>
                      <ArrowRight
                        aria-hidden
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/80 transition duration-300 group-hover:translate-x-0.5 group-hover:text-white"
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
