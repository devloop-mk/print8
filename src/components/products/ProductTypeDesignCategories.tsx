'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
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
        <div>
          <h3 className="text-sm font-semibold text-ink-900 sm:text-base">
            {t('title')}
          </h3>
          <p className="mt-0.5 text-sm text-ink-600">{t('subtitle')}</p>
        </div>

        <div className="w-full min-w-0 max-w-full overflow-hidden sm:overflow-visible">
          <ul
            className={cn(
              'flex w-full min-w-0 max-w-full gap-3 overflow-x-auto pb-1 [contain:inline-size]',
              'snap-x snap-mandatory scroll-smooth',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              'sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3 xl:grid-cols-5',
            )}
          >
          {categories.map((category) => {
            const title = t(`${category.id}.title`);
            const rawPreview =
              categoryPreviews?.[category.id] ??
              resolveCategoryMockupPreview(category, type);
            const preview = rawPreview
              ? resolveCategoryMockupPreview(category, type, rawPreview.design)
              : null;

            return (
              <li
                key={category.id}
                className="w-[9.5rem] shrink-0 sm:w-auto sm:min-w-0"
              >
                <Link
                  href={category.href}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-ink-200 bg-white transition hover:border-brand-300 hover:shadow-lift"
                >
                  <span className="relative block overflow-hidden bg-white transition duration-300 group-hover:scale-[1.03] [&_[data-mockup-frame]]:rounded-none [&_[data-mockup-frame]]:border-0">
                    {preview ? (
                      <DesignTemplatePreview
                        product={preview.product}
                        color={preview.color}
                        design={preview.design}
                        typeLabel={tp(preview.product.type)}
                      />
                    ) : (
                      <span className="block aspect-square bg-ink-50" />
                    )}
                  </span>
                  <span className="border-t border-ink-100 px-2.5 py-2.5">
                    <span className="block text-sm font-semibold leading-snug text-ink-900">
                      {title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-600">
                      {t(`${category.id}.description`)}
                    </span>
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
