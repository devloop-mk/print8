'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import type { ProductType } from '@/lib/data/catalog';
import {
  getProductNavCategory,
  productCategoryHref,
  productNavCategories,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import { getProductsForCategory } from '@/lib/products/product-nav-catalog';
import { sortByDisplayOrder } from '@/lib/products/sort-by-display-order';
import { getProductTypeIcon } from '@/lib/products/product-type-icons';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import {
  CatalogFilterLayout,
  type CatalogFilterGroup,
} from '@/components/catalog/CatalogFilterLayout';
import { filterProductsBySearchQuery } from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { useCatalogPagination } from '@/hooks/useCatalogPagination';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

type CategoryTypeFilter = ProductType | 'all';

import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';

type ProductCategoryCatalogVariant = 'browse' | 'landing';

export function ProductCategoryCatalog({
  categoryId,
  variant = 'browse',
  displayOrder,
}: {
  categoryId: ProductNavCategoryId;
  variant?: ProductCategoryCatalogVariant;
  displayOrder?: Record<string, number>;
}) {
  const t = useTranslations('products');
  const tcat = useTranslations('products.catalog');
  const tc = useTranslations('products.categoryPages');
  const tNav = useTranslations('nav.productsMenu.categories');
  const ts = useTranslations('search');
  const searchLabels = useCatalogSearchLabels();
  const category = getProductNavCategory(categoryId);
  const categoryProducts = useMemo(
    () => sortByDisplayOrder(getProductsForCategory(categoryId), displayOrder),
    [categoryId, displayOrder],
  );
  const [typeFilter, setTypeFilter] = useState<CategoryTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredByType =
    typeFilter === 'all'
      ? categoryProducts
      : categoryProducts.filter((product) => product.type === typeFilter);

  const filtered = useMemo(
    () =>
      filterProductsBySearchQuery(filteredByType, searchQuery, searchLabels),
    [filteredByType, searchQuery, searchLabels],
  );

  const filterSignature = useMemo(
    () => [typeFilter, searchQuery.trim()].join('|'),
    [searchQuery, typeFilter],
  );

  const { page, setPage, resetPage, paginate } = useCatalogPagination({
    totalItems: filtered.length,
  });

  const prevFilterSignature = useRef(filterSignature);
  useEffect(() => {
    if (prevFilterSignature.current === filterSignature) return;
    prevFilterSignature.current = filterSignature;
    resetPage();
  }, [filterSignature, resetPage]);

  const visibleProducts = useMemo(
    () => paginate(filtered),
    [filtered, paginate],
  );

  const filterGroups = useMemo((): CatalogFilterGroup[] => {
    if (category.types.length <= 1) return [];

    return [
      {
        kind: 'options',
        id: 'productType',
        title: t('filterGroups.productType'),
        allOption,
        options: filterOptions,
        value: typeFilter,
        onChange: (value) => setTypeFilter(value as CategoryTypeFilter),
      },
    ];
  }, [allOption, category.types.length, filterOptions, t, typeFilter]);

  const isLanding = variant === 'landing';

  return (
    <div className="w-full min-w-0 max-w-full space-y-8">
      <Link
        href={isLanding ? PRODUCT_OFFERING_PATHS.all : productCategoryHref(categoryId)}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {isLanding ? tc('backToAll') : tc('backToCategory')}
      </Link>

      <div className="max-w-3xl">
        {!isLanding ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            {tNav(categoryId)}
          </p>
        ) : null}
        <h1 className={cn('text-3xl font-bold text-ink-900 sm:text-4xl', !isLanding && 'mt-2')}>
          {isLanding ? tNav(categoryId) : tc('browseTitle')}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-600">
          {isLanding
            ? tc(`${categoryId}.subtitle`)
            : tc('browseSubtitle', { category: tNav(categoryId) })}
        </p>
      </div>

      <CatalogFilterLayout
        groups={filterGroups}
        ariaLabel={t('filterLabel')}
        showFiltersLabel={t('showFilters')}
        hideFiltersLabel={t('hideFilters')}
        resultsCount={filtered.length}
        resultsLabel={(count) => t('resultsCount', { count })}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t('searchPlaceholder')}
        searchAriaLabel={t('searchAriaLabel')}
        searchClearLabel={ts('clear')}
      >
        <Reveal delay={80}>
          <div id="products-grid" className="scroll-mt-24">
            <ProductCardGrid items={visibleProducts} linkTarget="customizer" />
            <CatalogPagination
              page={page}
              totalItems={filtered.length}
              onPageChange={setPage}
              previousLabel={tcat('paginationPrevious')}
              nextLabel={tcat('paginationNext')}
              pageLabel={(current, total) =>
                tcat('paginationPage', { current, total })
              }
            />
          </div>
        </Reveal>
      </CatalogFilterLayout>

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
