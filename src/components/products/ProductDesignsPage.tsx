'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  products,
  type ProductDesignCategory,
} from '@/lib/data/catalog';
import { getProductPaths, PRODUCT_OFFERING_PATHS, COUPLES_DESIGN_COLLECTION, KIDS_DESIGN_COLLECTION } from '@/lib/products/paths';
import { getProductDisplayPrice } from '@/lib/products/tshirt-print-pricing';
import {
  filterDesignCatalogEntries,
  getCatalogColors,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import { getDesignCollectionLabel } from '@/lib/products/design-collection-labels';
import {
  sortDesignCatalogEntries,
  type DesignCatalogSort,
} from '@/lib/products/design-catalog-sort';
import { getCouplePackTemplates } from '@/lib/data/couple-pack';
import { resolveProductId } from '@/lib/products/product-id-aliases';
import { formatPrice } from '@/lib/utils';
import {
  CatalogFilterLayout,
  type CatalogFilterGroup,
} from '@/components/catalog/CatalogFilterLayout';
import { CatalogSortSelect } from '@/components/catalog/CatalogSortSelect';
import { CatalogPageSizeSelect } from '@/components/catalog/CatalogPageSizeSelect';
import { ProductDesignCatalogCard } from '@/components/products/ProductDesignCatalogCard';
import { filterProductDesignEntriesBySearchQuery } from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import { CatalogGridLayout } from '@/components/catalog/CatalogGrid';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { useCatalogPagination } from '@/hooks/useCatalogPagination';
import {
  parseCatalogPageSize,
  PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZE,
  PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZES,
} from '@/lib/catalog/pagination';
import { Reveal } from '@/components/motion/Reveal';

type ProductDesignsPageProps = {
  productId: string;
  entries: ProductDesignCatalogEntry[];
  category?: ProductDesignCategory | 'all';
};

export function ProductDesignsPage({
  productId,
  entries,
  category = 'image-designs',
}: ProductDesignsPageProps) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');
  const tc = useTranslations('products.catalog');
  const ts = useTranslations('search');
  const locale = useLocale() as 'mk' | 'en';
  const searchLabels = useCatalogSearchLabels();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const product = useMemo(
    () => products.find((p) => p.id === resolveProductId(productId)),
    [productId],
  );

  const [colorFilter, setColorFilter] = useState<string | 'all'>('all');
  const [collectionFilter, setCollectionFilter] = useState<string | 'all'>(() => {
    const fromUrl = searchParams.get('collection');
    return fromUrl && fromUrl.trim() ? fromUrl.trim() : 'all';
  });
  const [sort, setSort] = useState<DesignCatalogSort>('featured');
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get('q') ?? '',
  );

  useEffect(() => {
    const fromUrl = searchParams.get('collection');
    setCollectionFilter(fromUrl && fromUrl.trim() ? fromUrl.trim() : 'all');
    setSearchQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const pageSize = useMemo(
    () =>
      parseCatalogPageSize(
        searchParams.get('perPage'),
        PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZES,
        PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZE,
      ),
    [searchParams],
  );

  const handlePageSizeChange = useCallback(
    (next: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZE) params.delete('perPage');
      else params.set('perPage', String(next));
      params.delete('page');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const availableColors = useMemo(() => getCatalogColors(entries), [entries]);

  const entriesForCollectionOptions = useMemo(() => {
    if (!product) return [];
    const byType = filterDesignCatalogEntries(entries, {
      type: product.type,
      color: 'all',
    });
    if (!searchQuery.trim()) return byType;
    return filterProductDesignEntriesBySearchQuery(
      byType,
      searchQuery,
      searchLabels,
    );
  }, [entries, product, searchLabels, searchQuery]);

  const collectionOptions = useMemo(() => {
    if (!product) return [];
    const collections = new Set<string>();
    for (const entry of entriesForCollectionOptions) {
      if (entry.design.collection) collections.add(entry.design.collection);
    }

    let packs = getCouplePackTemplates().filter((pack) =>
      pack.productTypes.includes(product.type),
    );
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      packs = packs.filter((pack) => {
        const haystack = `${pack.titleEn} ${pack.titleMk} ${pack.partnerDesigns
          .map((partner) => `${partner.labelEn} ${partner.labelMk}`)
          .join(' ')}`.toLowerCase();
        return haystack.includes(query);
      });
    }
    if (packs.length > 0) {
      collections.add(COUPLES_DESIGN_COLLECTION);
    }

    return [...collections]
      .map((value) => ({
        value,
        label: getDesignCollectionLabel(value, locale),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [entriesForCollectionOptions, locale, product, searchQuery]);

  useEffect(() => {
    if (collectionFilter === 'all') return;
    if (collectionOptions.some((option) => option.value === collectionFilter)) {
      return;
    }
    setCollectionFilter('all');
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has('collection')) return;
    params.delete('collection');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    collectionFilter,
    collectionOptions,
    pathname,
    router,
    searchParams,
  ]);

  const handleCollectionChange = useCallback(
    (value: string | 'all') => {
      if (value === KIDS_DESIGN_COLLECTION) {
        router.push(PRODUCT_OFFERING_PATHS.kidsReadyDesigns);
        return;
      }
      if (value === COUPLES_DESIGN_COLLECTION) {
        router.push(PRODUCT_OFFERING_PATHS.couplesReadyDesigns);
        return;
      }

      setCollectionFilter(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') params.delete('collection');
      else params.set('collection', value);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const filteredByAttributes = useMemo(() => {
    if (!product) return [];
    return filterDesignCatalogEntries(entries, {
      type: product.type,
      color: colorFilter,
    }).filter((entry) =>
      collectionFilter === 'all'
        ? true
        : entry.design.collection === collectionFilter,
    );
  }, [collectionFilter, colorFilter, entries, product]);

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
    () => [collectionFilter, colorFilter, searchQuery.trim(), sort].join('|'),
    [collectionFilter, colorFilter, searchQuery, sort],
  );

  const { page, setPage, resetPage, paginate } = useCatalogPagination({
    totalItems: filtered.length,
    pageSize,
    preventScroll: true,
  });

  const prevFilterSignature = useRef(filterSignature);
  useEffect(() => {
    if (prevFilterSignature.current === filterSignature) return;
    prevFilterSignature.current = filterSignature;
    resetPage();
  }, [filterSignature, resetPage]);

  const isInitialCatalogPage = useRef(true);
  useEffect(() => {
    if (page <= 1) return;
    const target = document.getElementById('product-designs');
    if (!target) return;
    const behavior = isInitialCatalogPage.current ? 'auto' : 'smooth';
    isInitialCatalogPage.current = false;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior, block: 'start' });
    });
  }, [page]);

  const visibleEntries = useMemo(
    () => paginate(filtered),
    [filtered, paginate],
  );

  const filterGroups = useMemo((): CatalogFilterGroup[] => {
    const groups: CatalogFilterGroup[] = [];

    if (collectionOptions.length > 0) {
      groups.push({
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
        onChange: handleCollectionChange,
      });
    }

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
    availableColors,
    collectionFilter,
    collectionOptions,
    colorFilter,
    handleCollectionChange,
    tc,
  ]);

  if (!product) {
    return <p>{td('notFound')}</p>;
  }

  const paths = getProductPaths(product.id, product.type);
  const isPhoto = category === 'image-designs';
  const isText = category === 'text-designs';
  const sectionTitle = isPhoto
    ? td('imageDesigns')
    : isText
      ? td('textDesigns')
      : td('premadeDesigns');
  const sectionHint = isPhoto
    ? td('imageDesignsPageHint')
    : isText
      ? td('textDesignsPageHint')
      : td('premadeDesignsPageHint');

  return (
    <div id="product-designs" className="scroll-mt-24 space-y-8">
      <Link
        href={paths.detail}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {td('backToProduct')}
      </Link>

      <Reveal>
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-600">{tp(product.type)}</p>
          <h1 className="mt-1 text-3xl font-bold text-ink-900">{sectionTitle}</h1>
          <p className="mt-2 text-ink-600">{sectionHint}</p>
          <p className="mt-2 text-brand-600">
            {t('startingFrom')}{' '}
            {formatPrice(getProductDisplayPrice(product), locale)}
          </p>
        </div>
      </Reveal>

      <Reveal delay={100} className="min-w-0">
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
            <>
              <CatalogGridLayout
                toolbarStart={
                  <div className="mr-auto flex flex-wrap items-center gap-2">
                    <CatalogSortSelect value={sort} onChange={setSort} />
                    <CatalogPageSizeSelect
                      value={pageSize}
                      onChange={handlePageSizeChange}
                      options={PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZES}
                    />
                  </div>
                }
              >
                {visibleEntries.map((entry) => (
                  <ProductDesignCatalogCard
                    key={entry.design.id}
                    entry={entry}
                    colorFilter={colorFilter}
                    preferredProductType={product.type}
                    preferredProductId={product.id}
                  />
                ))}
              </CatalogGridLayout>
              <CatalogPagination
                page={page}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setPage}
                previousLabel={tc('paginationPrevious')}
                nextLabel={tc('paginationNext')}
                pageLabel={(current, total) =>
                  tc('paginationPage', { current, total })
                }
              />
            </>
          )}
        </CatalogFilterLayout>
      </Reveal>
    </div>
  );
}
