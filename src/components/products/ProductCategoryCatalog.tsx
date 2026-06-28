'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import type { ProductType } from '@/lib/data/catalog';
import {
  getProductNavCategory,
  getProductsForCategory,
  productCategoryHref,
  productNavCategories,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import { getProductTypeIcon } from '@/lib/products/product-type-icons';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { FilterChipBar } from '@/components/catalog/FilterChipBar';
import { Reveal } from '@/components/motion/Reveal';

type CategoryTypeFilter = ProductType | 'all';

export function ProductCategoryCatalog({
  categoryId,
}: {
  categoryId: ProductNavCategoryId;
}) {
  const t = useTranslations('products');
  const tc = useTranslations('products.categoryPages');
  const tNav = useTranslations('nav.productsMenu.categories');
  const category = getProductNavCategory(categoryId);
  const categoryProducts = getProductsForCategory(categoryId);
  const [typeFilter, setTypeFilter] = useState<CategoryTypeFilter>('all');

  const allOption = {
    value: 'all' as const,
    label: tc('allInCategory'),
    icon: getProductTypeIcon('all'),
  };

  const filterOptions = useMemo(
    () =>
      category.types.map((type) => ({
        value: type,
        label: t(`typesPlural.${type}`),
        icon: getProductTypeIcon(type),
      })),
    [category.types, t],
  );

  const filtered =
    typeFilter === 'all'
      ? categoryProducts
      : categoryProducts.filter((product) => product.type === typeFilter);

  return (
    <div className="w-full min-w-0 max-w-full space-y-8">
      <Link
        href={productCategoryHref(categoryId)}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc('backToCategory')}
      </Link>

      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          {tNav(categoryId)}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink-900 sm:text-4xl">
          {tc('browseTitle')}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-600">
          {tc('browseSubtitle', { category: tNav(categoryId) })}
        </p>
      </div>

      {category.types.length > 1 ? (
        <Reveal>
          <FilterChipBar
            ariaLabel={t('filterLabel')}
            showFiltersLabel={t('showFilters')}
            hideFiltersLabel={t('hideFilters')}
            allOption={allOption}
            options={filterOptions}
            value={typeFilter}
            onChange={setTypeFilter}
            resultsCount={filtered.length}
            resultsLabel={(count) => t('resultsCount', { count })}
            mobileLayout="collapse"
          />
        </Reveal>
      ) : null}

      <Reveal delay={80}>
        <div id="products-grid" className="scroll-mt-24">
          <ProductCardGrid items={filtered} />
        </div>
      </Reveal>

      <div className="flex flex-wrap gap-3 border-t border-ink-100 pt-8">
        {productNavCategories
          .filter((other) => other.id !== categoryId)
          .map((other) => (
            <Link
              key={other.id}
              href={productCategoryHref(other.id)}
              className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              {tNav(other.id)}
            </Link>
          ))}
      </div>
    </div>
  );
}
