'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ArrowRight, Palette } from 'lucide-react';
import {
  type ProductType,
} from '@/lib/data/catalog';
import { buildProductTypeFilterOptions } from '@/lib/products/product-type-icons';
import {
  getProductNavCategory,
  productCategoryCustomHref,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import {
  filterDesignCatalogEntries,
  getCatalogColors,
  getCombinedProductDesignCatalogEntries,
} from '@/lib/products/design-catalog';
import {
  sortDesignCatalogEntries,
  type DesignCatalogSort,
} from '@/lib/products/design-catalog-sort';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import {
  CatalogFilterLayout,
  type CatalogFilterGroup,
} from '@/components/catalog/CatalogFilterLayout';
import { CatalogSortSelect } from '@/components/catalog/CatalogSortSelect';
import { ProductDesignCatalogCard } from '@/components/products/ProductDesignCatalogCard';
import {
  filterProductDesignEntriesBySearchQuery,
} from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import { Reveal } from '@/components/motion/Reveal';
import { CatalogGridLayout } from '@/components/catalog/CatalogGrid';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { useCatalogPagination } from '@/hooks/useCatalogPagination';
import { Button } from '@/components/ui/Button';

type TypeFilter = ProductType | 'all';

export function ProductCategoryPremadeCatalog({
  categoryId,
}: {
  categoryId: ProductNavCategoryId;
}) {
  const t = useTranslations('products');
  const tc = useTranslations('products.catalog');
  const tcat = useTranslations('products.categoryPages');
  const tNav = useTranslations('nav.productsMenu.categories');
  const ts = useTranslations('search');
  const locale = useLocale() as 'mk' | 'en';
  const searchLabels = useCatalogSearchLabels();
  const category = getProductNavCategory(categoryId);

  const allEntries = useMemo(
    () => getCombinedProductDesignCatalogEntries(categoryId),
    [categoryId],
  );

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [colorFilter, setColorFilter] = useState<string | 'all'>('all');
  const [sort, setSort] = useState<DesignCatalogSort>('featured');
  const [searchQuery, setSearchQuery] = useState('');

  const { allOption, options: typeOptions } = useMemo(() => {
    const built = buildProductTypeFilterOptions((type) =>
      type === 'all' ? t('allTypes') : t(`typesPlural.${type}`),
    );
    const allowed = new Set(category.types);

    return {
      allOption: built.allOption,
      options: built.options.filter((option) => allowed.has(option.value)),
    };
  }, [category.types, t]);

  const availableColors = useMemo(
    () => getCatalogColors(allEntries),
    [allEntries],
  );

  const filteredByAttributes = useMemo(
    () =>
      filterDesignCatalogEntries(allEntries, {
        type: typeFilter,
        color: colorFilter,
      }),
    [allEntries, typeFilter, colorFilter],
  );

  const filtered = useMemo(() => {
    const searched = filterProductDesignEntriesBySearchQuery(
      filteredByAttributes,
      searchQuery,
      searchLabels,
    );
    return sortDesignCatalogEntries(searched, sort, {
      locale,
      colorFilter,
      translateName: (key) => t(key),
    });
  }, [
    colorFilter,
    filteredByAttributes,
    locale,
    searchLabels,
    searchQuery,
    sort,
    t,
  ]);

  const filterSignature = useMemo(
    () =>
      [typeFilter, colorFilter, searchQuery.trim(), sort].join('|'),
    [colorFilter, searchQuery, sort, typeFilter],
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

  const visibleEntries = useMemo(
    () => paginate(filtered),
    [filtered, paginate],
  );

  const filterGroups = useMemo((): CatalogFilterGroup[] => {
    const groups: CatalogFilterGroup[] = [
      {
        kind: 'options',
        id: 'productType',
        title: t('filterGroups.productType'),
        allOption,
        options: typeOptions,
        value: typeFilter,
        onChange: (value) => setTypeFilter(value as TypeFilter),
      },
    ];

    if (availableColors.length > 0) {
      groups.push({
        kind: 'colors',
        id: 'color',
        title: tc('filterColor'),
        colors: availableColors,
        value: colorFilter,
        onChange: setColorFilter,
        allLabel: tc('allColors'),
      });
    }

    return groups;
  }, [
    allOption,
    availableColors,
    colorFilter,
    t,
    tc,
    typeFilter,
    typeOptions,
  ]);

  return (
    <div className="w-full min-w-0 max-w-full space-y-8">
      <Link
        href={PRODUCT_OFFERING_PATHS.all}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {tcat('backToAll')}
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">
            {tNav(categoryId)}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-ink-600">
            {tcat(`${categoryId}.subtitle`)}
          </p>
        </div>

        <Link href={productCategoryCustomHref(categoryId)} className="shrink-0">
          <Button size="lg" variant="outline" className="w-full sm:w-auto">
            <Palette className="mr-2 h-4 w-4" aria-hidden />
            {tcat('makeYourOwn')}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </div>

      <Reveal delay={40}>
        <CatalogFilterLayout
          groups={filterGroups}
          ariaLabel={t('filterLabel')}
          showFiltersLabel={t('showFilters')}
          hideFiltersLabel={t('hideFilters')}
          resultsCount={filtered.length}
          resultsLabel={(count) => tc('resultsDesigns', { count })}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('searchPlaceholder')}
          searchAriaLabel={t('searchAriaLabel')}
          searchClearLabel={ts('clear')}
        >
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-12 text-center text-sm text-ink-500">
              {tc('noDesigns')}
            </p>
          ) : (
            <Reveal delay={80}>
              <CatalogGridLayout
                toolbarStart={
                  <CatalogSortSelect value={sort} onChange={setSort} />
                }
              >
                {visibleEntries.map((entry) => (
                  <ProductDesignCatalogCard
                    key={entry.design.id}
                    entry={entry}
                    colorFilter={colorFilter}
                  />
                ))}
              </CatalogGridLayout>
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
          )}
        </CatalogFilterLayout>
      </Reveal>
    </div>
  );
}
