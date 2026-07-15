'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { products, productTypes, type ProductType } from '@/lib/data/catalog';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import {
  getProductNavCategory,
  parseProductNavCategoryFilter,
  productBelongsToCategory,
  productCategoryHref,
  productNavCategories,
  productTypeHref,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import { buildProductTypeFilterOptions } from '@/lib/products/product-type-icons';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
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

type ProductFilter = ProductType | 'all';

function buildCustomProductsHref(
  category: ProductNavCategoryId | 'all',
  type: ProductFilter,
): string {
  const params = new URLSearchParams();
  if (category !== 'all') params.set('category', category);
  if (type !== 'all') params.set('type', type);
  const query = params.toString();
  return query ? `/products/custom?${query}` : '/products/custom';
}

export function ProductCustomCatalog() {
  const t = useTranslations('products');
  const tc = useTranslations('products.catalog');
  const tcat = useTranslations('products.categoryPages');
  const tNav = useTranslations('nav.productsMenu.categories');
  const ts = useTranslations('search');
  const searchLabels = useCatalogSearchLabels();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductNavCategoryId | 'all'>(() =>
    parseProductNavCategoryFilter(searchParams.get('category')),
  );
  const [typeFilter, setTypeFilter] = useState<ProductFilter>(() =>
    parseProductTypeFilter(searchParams.get('type')),
  );

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && (productTypes as readonly string[]).includes(typeParam)) {
      router.replace(productTypeHref(typeParam as ProductType));
      return;
    }

    const nextCategory = parseProductNavCategoryFilter(
      searchParams.get('category'),
    );
    setCategoryFilter(nextCategory);
    setTypeFilter(parseProductTypeFilter(typeParam));
  }, [searchParams, router]);

  const scopedProducts = useMemo(() => {
    if (categoryFilter === 'all') return products;
    return products.filter((product) =>
      productBelongsToCategory(product, categoryFilter),
    );
  }, [categoryFilter]);

  const { allOption, options: filterOptions } = useMemo(() => {
    const built = buildProductTypeFilterOptions((type) =>
      type === 'all' ? t('allTypes') : t(`typesPlural.${type}`),
    );

    if (categoryFilter === 'all') return built;

    const allowed = new Set(getProductNavCategory(categoryFilter).types);
    return {
      allOption: built.allOption,
      options: built.options.filter((option) => allowed.has(option.value)),
    };
  }, [categoryFilter, t]);

  const filteredByType =
    typeFilter === 'all'
      ? scopedProducts
      : scopedProducts.filter((product) => product.type === typeFilter);

  const filtered = useMemo(
    () =>
      filterProductsBySearchQuery(filteredByType, searchQuery, searchLabels),
    [filteredByType, searchQuery, searchLabels],
  );

  const filterSignature = useMemo(
    () => [categoryFilter, typeFilter, searchQuery.trim()].join('|'),
    [categoryFilter, searchQuery, typeFilter],
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

  const categoryOptions = useMemo(
    () =>
      productNavCategories.map((category) => ({
        value: category.id,
        label: tNav(category.id),
      })),
    [tNav],
  );

  function updateCategory(next: ProductNavCategoryId | 'all') {
    setCategoryFilter(next);
    setTypeFilter('all');
    router.replace(buildCustomProductsHref(next, 'all'), { scroll: false });
  }

  function updateType(next: ProductFilter) {
    setTypeFilter(next);
    router.replace(buildCustomProductsHref(categoryFilter, next), { scroll: false });
  }

  const filterGroups = useMemo((): CatalogFilterGroup[] => {
    const groups: CatalogFilterGroup[] = [
      {
        kind: 'options',
        id: 'category',
        title: t('filterGroups.category'),
        allOption: { value: 'all', label: t('allCategories') },
        options: categoryOptions,
        value: categoryFilter,
        onChange: (value) =>
          updateCategory(value as ProductNavCategoryId | 'all'),
      },
      {
        kind: 'options',
        id: 'productType',
        title: t('filterGroups.productType'),
        allOption,
        options: filterOptions,
        value: typeFilter,
        onChange: (value) => updateType(value as ProductFilter),
      },
    ];

    return groups;
  }, [
    allOption,
    categoryFilter,
    categoryOptions,
    filterOptions,
    t,
    typeFilter,
  ]);

  const backHref =
    categoryFilter === 'all'
      ? PRODUCT_OFFERING_PATHS.all
      : productCategoryHref(categoryFilter);
  const backLabel =
    categoryFilter === 'all' ? tc('backToProducts') : tcat('backToCategory');

  return (
    <div className="w-full min-w-0 max-w-full space-y-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="max-w-3xl">
        {categoryFilter !== 'all' ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            {tNav(categoryFilter as ProductNavCategoryId)}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-bold text-ink-900">{tc('customTitle')}</h1>
        <p className="mt-2 text-ink-600">{tc('customSubtitle')}</p>
      </div>

      <Link
        href={PRODUCT_OFFERING_PATHS.brandingPack}
        className="block rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-lift transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lift-brand sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          {tc('brandingPackBadge')}
        </p>
        <h2 className="mt-1 text-lg font-bold text-ink-900 sm:text-xl">
          {tc('brandingPackTitle')}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-600 sm:text-base">
          {tc('brandingPackDesc')}
        </p>
        <p className="mt-3 text-sm font-semibold text-brand-700">
          {tc('brandingPackCta')} →
        </p>
      </Link>

      <Reveal delay={40}>
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
            <ProductCardGrid items={visibleProducts} linkTarget="customizer" />
            <CatalogPagination
              page={page}
              totalItems={filtered.length}
              onPageChange={setPage}
              previousLabel={tc('paginationPrevious')}
              nextLabel={tc('paginationNext')}
              pageLabel={(current, total) =>
                tc('paginationPage', { current, total })
              }
            />
          </Reveal>
        </CatalogFilterLayout>
      </Reveal>
    </div>
  );
}
