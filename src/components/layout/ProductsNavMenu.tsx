'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  productNavCategories,
  productNavQuickLinks,
  productCategoryHref,
  productTypeHref,
} from '@/lib/products/product-nav';
import { getProductTypeIcon } from '@/lib/products/product-type-icons';
import type { ProductType } from '@/lib/data/catalog';
import { ChevronRight } from 'lucide-react';

type ProductsNavMenuProps = {
  onNavigate?: () => void;
  variant?: 'dropdown' | 'mobile';
};

function TypeLink({
  type,
  onNavigate,
  compact,
}: {
  type: ProductType;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const t = useTranslations('products.typesPlural');
  const Icon = getProductTypeIcon(type);

  return (
    <Link
      href={productTypeHref(type)}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg transition hover:bg-brand-50',
        compact ? 'px-2.5 py-2' : 'px-3 py-2',
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-ink-600 transition group-hover:bg-white group-hover:text-brand-600">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="text-sm font-medium text-ink-800 group-hover:text-brand-700">
        {t(type)}
      </span>
    </Link>
  );
}

export function ProductsNavMenu({
  onNavigate,
  variant = 'dropdown',
}: ProductsNavMenuProps) {
  const t = useTranslations('nav.productsMenu');
  const isMobile = variant === 'mobile';

  return (
    <div
      className={cn(
        isMobile ? 'space-y-4' : 'grid gap-6 p-1 sm:grid-cols-2 lg:gap-8',
      )}
    >
      <div>
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          {t('browseByType')}
        </p>
        <div className={cn('mt-3 space-y-4', isMobile && 'space-y-3')}>
          {productNavCategories.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <div key={category.id}>
                <Link
                  href={productCategoryHref(category.id)}
                  onClick={onNavigate}
                  className="group mb-1.5 flex items-center gap-2 rounded-lg px-1 py-1 transition hover:bg-brand-50"
                >
                  <CategoryIcon
                    className="h-4 w-4 shrink-0 text-ink-500 transition group-hover:text-brand-600"
                    aria-hidden
                  />
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-500 transition group-hover:text-brand-700">
                    {t(`categories.${category.id}`)}
                  </span>
                </Link>
                <div
                  className={cn(
                    'grid gap-0.5',
                    isMobile ? 'grid-cols-1' : 'grid-cols-1',
                  )}
                >
                  {category.types.map((type) => (
                    <TypeLink
                      key={type}
                      type={type}
                      onNavigate={onNavigate}
                      compact={isMobile}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          {t('personalize')}
        </p>
        <ul className="mt-3 space-y-1">
          {productNavQuickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.id}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="group flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-brand-50 sm:px-3"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-white">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                      {t(`links.${link.labelKey}`)}
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                        aria-hidden
                      />
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-500">
                      {t(`links.${link.descriptionKey}`)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
