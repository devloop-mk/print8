'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  type ProductDesignCategory,
  type ProductSide,
  type ProductType,
} from '@/lib/data/catalog';
import { buildProductTypeFilterOptions } from '@/lib/products/product-type-icons';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import {
  getProductNavCategory,
  parseProductNavCategoryFilter,
  productBelongsToCategory,
  productCategoryHref,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import {
  filterDesignCatalogEntries,
  getCatalogColors,
  getProductDesignCatalogEntries,
} from '@/lib/products/design-catalog';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import {
  CatalogFilterLayout,
  type CatalogFilterGroup,
} from '@/components/catalog/CatalogFilterLayout';
import { ProductDesignCatalogCard } from '@/components/products/ProductDesignCatalogCard';
import {
  filterProductDesignEntriesBySearchQuery,
} from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import { Reveal } from '@/components/motion/Reveal';
import { CatalogGridLayout } from '@/components/catalog/CatalogGrid';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { useCatalogPagination } from '@/hooks/useCatalogPagination';

type ProductDesignsCatalogProps = {
  category: ProductDesignCategory;
};

type TypeFilter = ProductType | 'all';
type SideFilter = ProductSide | 'all';

const STREETWEAR_COLLECTION_LABELS: Record<string, { en: string; mk: string }> = {
  basketball: { en: 'Basketball', mk: 'Кошарка' },
  anime: { en: 'Japanese Anime', mk: 'Јапонско аниме' },
  typography: { en: 'Streetwear Typography', mk: 'Стритвер типографија' },
  streetwear: { en: 'Streetwear', mk: 'Стритвер' },
};

export function ProductDesignsCatalog({ category }: ProductDesignsCatalogProps) {
  const t = useTranslations('products');
  const locale = useLocale() as 'mk' | 'en';
  const tc = useTranslations('products.catalog');
  const tcat = useTranslations('products.categoryPages');
  const tNav = useTranslations('nav.productsMenu.categories');
  const ts = useTranslations('search');
  const searchLabels = useCatalogSearchLabels();
  const searchParams = useSearchParams();
  const categoryFilter = parseProductNavCategoryFilter(
    searchParams.get('category'),
  );

  const allEntries = useMemo(() => {
    const entries = getProductDesignCatalogEntries(category);
    if (categoryFilter === 'all') return entries;

    return entries
      .map((entry) => ({
        design: entry.design,
        products: entry.products.filter((product) =>
          productBelongsToCategory(product, categoryFilter),
        ),
      }))
      .filter((entry) => entry.products.length > 0);
  }, [category, categoryFilter]);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(() =>
    parseProductTypeFilter(searchParams.get('type')),
  );
  const [colorFilter, setColorFilter] = useState<string | 'all'>('all');
  const [sideFilter, setSideFilter] = useState<SideFilter>('all');
  const [collectionFilter, setCollectionFilter] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const collectionOptions = useMemo(() => {
    const collections = new Set<string>();
    for (const entry of allEntries) {
      if (entry.design.collection) collections.add(entry.design.collection);
    }
    return [...collections]
      .map((value) => ({
        value,
        label:
          locale === 'mk'
            ? (STREETWEAR_COLLECTION_LABELS[value]?.mk ?? value)
            : (STREETWEAR_COLLECTION_LABELS[value]?.en ?? value),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allEntries, locale]);

  const { allOption, options: typeOptions } = useMemo(() => {
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

  const availableColors = useMemo(
    () => getCatalogColors(allEntries),
    [allEntries],
  );

  const filteredByAttributes = useMemo(
    () =>
      filterDesignCatalogEntries(allEntries, {
        type: typeFilter,
        color: colorFilter,
        side: sideFilter,
      }).filter((entry) =>
        collectionFilter === 'all'
          ? true
          : entry.design.collection === collectionFilter,
      ),
    [allEntries, typeFilter, colorFilter, sideFilter, collectionFilter],
  );

  const filtered = useMemo(
    () =>
      filterProductDesignEntriesBySearchQuery(
        filteredByAttributes,
        searchQuery,
        searchLabels,
      ),
    [filteredByAttributes, searchQuery, searchLabels],
  );

  const filterSignature = useMemo(
    () =>
      [
        categoryFilter,
        typeFilter,
        colorFilter,
        sideFilter,
        collectionFilter,
        searchQuery.trim(),
      ].join('|'),
    [
      categoryFilter,
      collectionFilter,
      colorFilter,
      searchQuery,
      sideFilter,
      typeFilter,
    ],
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

  const pageTitle =
    category === 'image-designs'
      ? tc('readyDesignsTitle')
      : tc('textTemplatesTitle');
  const pageSubtitle =
    category === 'image-designs'
      ? tc('readyDesignsSubtitle')
      : tc('textTemplatesSubtitle');

  const backHref =
    categoryFilter === 'all'
      ? PRODUCT_OFFERING_PATHS.all
      : productCategoryHref(categoryFilter);
  const backLabel =
    categoryFilter === 'all' ? tc('backToProducts') : tcat('backToCategory');

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

    groups.push({
      kind: 'pills',
      id: 'side',
      title: tc('filterSide'),
      options: [
        { value: 'all' as const, label: tc('allSides') },
        { value: 'front' as const, label: tc('sideFront') },
        { value: 'back' as const, label: tc('sideBack') },
        { value: 'left' as const, label: tc('sideLeft') },
        { value: 'right' as const, label: tc('sideRight') },
      ],
      value: sideFilter,
      onChange: (value) => setSideFilter(value as SideFilter),
    });

    if (collectionOptions.length > 0) {
      groups.unshift({
        kind: 'pills',
        id: 'collection',
        title: tc('filterCollection'),
        options: [
          { value: 'all' as const, label: tc('allCollections') },
          ...collectionOptions.map((option) => ({
            value: option.value,
            label: option.label,
          })),
        ],
        value: collectionFilter,
        onChange: (value) => setCollectionFilter(value),
      });
    }

    return groups;
  }, [
    allOption,
    availableColors,
    colorFilter,
    collectionFilter,
    collectionOptions,
    sideFilter,
    t,
    tc,
    typeFilter,
    typeOptions,
  ]);

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
        <h1 className="mt-1 text-3xl font-bold text-ink-900">{pageTitle}</h1>
        <p className="mt-2 text-ink-600">{pageSubtitle}</p>
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
              <CatalogGridLayout>
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
