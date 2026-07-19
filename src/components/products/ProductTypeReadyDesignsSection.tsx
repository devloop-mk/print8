'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ProductType } from '@/lib/data/catalog';
import {
  filterDesignCatalogEntries,
  getCatalogColors,
  type ProductDesignCatalogEntry,
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
import { filterProductDesignEntriesBySearchQuery } from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import { CatalogGridLayout } from '@/components/catalog/CatalogGrid';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { useCatalogPagination } from '@/hooks/useCatalogPagination';
import { Reveal } from '@/components/motion/Reveal';

type ProductTypeReadyDesignsSectionProps = {
  type: ProductType;
  entries: ProductDesignCatalogEntry[];
};

export function ProductTypeReadyDesignsSection({
  type,
  entries,
}: ProductTypeReadyDesignsSectionProps) {
  const t = useTranslations('products');
  const tt = useTranslations('products.typePages');
  const tc = useTranslations('products.catalog');
  const ts = useTranslations('search');
  const locale = useLocale() as 'mk' | 'en';
  const searchLabels = useCatalogSearchLabels();

  const [colorFilter, setColorFilter] = useState<string | 'all'>('all');
  const [sort, setSort] = useState<DesignCatalogSort>('featured');
  const [searchQuery, setSearchQuery] = useState('');

  const availableColors = useMemo(() => getCatalogColors(entries), [entries]);

  const filteredByAttributes = useMemo(
    () =>
      filterDesignCatalogEntries(entries, {
        type,
        color: colorFilter,
      }),
    [entries, type, colorFilter],
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
    () => [colorFilter, searchQuery.trim(), sort].join('|'),
    [colorFilter, searchQuery, sort],
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
    const groups: CatalogFilterGroup[] = [];

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
  }, [availableColors, colorFilter, tc]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section id="ready-designs" className="scroll-mt-24 space-y-6 border-t border-ink-100 pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-brand-600">
            <Sparkles className="h-5 w-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {tt('readyDesignsEyebrow')}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">
            {tt('readyDesignsTitle')}
          </h2>
          <p className="mt-2 text-ink-600">{tt('readyDesignsSubtitle')}</p>
        </div>
        <Link
          href={`${PRODUCT_OFFERING_PATHS.readyDesigns}?type=${type}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
        >
          {tt('viewAllReadyDesigns')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <Reveal delay={60}>
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
            </>
          )}
        </CatalogFilterLayout>
      </Reveal>
    </section>
  );
}
