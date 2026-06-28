'use client';

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import {
  designTemplates,
  designCategories,
  getDesignHref,
  type DesignCategory,
  type DesignTemplate,
} from '@/lib/data/catalog';
import { getDesignThumbAspect } from '@/lib/designs/design-thumb';
import { parseDesignCategoryFilter } from '@/lib/data/service-routes';
import {
  filterDesignsBySubfilter,
  getAvailableDesignSubfilters,
  parseDesignSubfilterFilter,
  type DesignSubfilterId,
} from '@/lib/designs/design-filters';
import { filterDesignsBySearchQuery } from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import { Card } from '@/components/ui/Card';
import { DesignCardThumbnail } from '@/components/designs/DesignCardThumbnail';
import {
  CatalogFilterLayout,
  type CatalogFilterGroup,
} from '@/components/catalog/CatalogFilterLayout';
import {
  CatalogGrid,
  CatalogGridProvider,
  CatalogGridToggle,
} from '@/components/catalog/CatalogGrid';

function DesignCard({
  design,
  actionLabel,
  badgeLabel,
}: {
  design: DesignTemplate;
  actionLabel: string;
  badgeLabel?: string;
}) {
  const t = useTranslations('designs');

  return (
    <Link href={getDesignHref(design)} className="group block">
      <Card className="overflow-hidden p-0 transition group-hover:shadow-md">
        <div
          className="relative flex items-center justify-center overflow-hidden bg-white p-1"
          style={{ aspectRatio: getDesignThumbAspect(design) }}
        >
          <DesignCardThumbnail
            design={design}
            alt={t(`templates.${design.id}`)}
          />
          {badgeLabel ? (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700 shadow-sm">
              {badgeLabel}
            </span>
          ) : null}
        </div>
        <div className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {t(`categories.${design.category}`)}
          </p>
          <p className="mt-1 font-medium text-ink-900 group-hover:text-brand-700">
            {t(`templates.${design.id}`)}
          </p>
          <p className="mt-3 text-sm font-medium text-brand-600">
            {actionLabel} →
          </p>
        </div>
      </Card>
    </Link>
  );
}

function buildDesignsHref(
  category: DesignCategory | 'all',
  subfilter: DesignSubfilterId | 'all',
  query = '',
): string {
  const params = new URLSearchParams();
  if (category !== 'all') params.set('category', category);
  if (subfilter !== 'all' && category !== 'all') {
    params.set('tag', subfilter);
  }
  const trimmed = query.trim();
  if (trimmed) params.set('q', trimmed);
  const queryString = params.toString();
  return queryString ? `/designs?${queryString}` : '/designs';
}

export function DesignsGallery() {
  const t = useTranslations('designs');
  const ts = useTranslations('search');
  const searchLabels = useCatalogSearchLabels();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [category, setCategory] = useState<DesignCategory | 'all'>(() =>
    parseDesignCategoryFilter(searchParams.get('category')),
  );
  const [subfilter, setSubfilter] = useState<DesignSubfilterId | 'all'>(() =>
    parseDesignSubfilterFilter(
      searchParams.get('tag'),
      parseDesignCategoryFilter(searchParams.get('category')),
    ),
  );
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    const nextCategory = parseDesignCategoryFilter(searchParams.get('category'));
    setCategory(nextCategory);
    setSubfilter(
      parseDesignSubfilterFilter(searchParams.get('tag'), nextCategory),
    );
    setSearchQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const updateSearchQuery = useCallback((nextQuery: string) => {
    setSearchQuery(nextQuery);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const paramsQuery = searchParams.get('q') ?? '';
      if (searchQuery === paramsQuery) return;
      router.replace(buildDesignsHref(category, subfilter, searchQuery), {
        scroll: false,
      });
    }, 350);

    return () => window.clearTimeout(timer);
  }, [category, router, searchParams, searchQuery, subfilter]);

  const filterOptions = useMemo(
    () =>
      designCategories.map((cat) => ({
        value: cat,
        label: t(`categories.${cat}`),
      })),
    [t],
  );

  const availableSubfilters = useMemo(
    () => (category === 'all' ? [] : getAvailableDesignSubfilters(category)),
    [category],
  );

  const subfilterOptions = useMemo(
    () =>
      availableSubfilters.map((item) => ({
        value: item.id,
        label: t(`subfilters.${category}.${item.id}`),
      })),
    [availableSubfilters, category, t],
  );

  function updateCategory(next: DesignCategory | 'all') {
    setCategory(next);
    setSubfilter('all');
    router.replace(buildDesignsHref(next, 'all', searchQuery), { scroll: false });
  }

  function updateSubfilter(next: DesignSubfilterId | 'all') {
    setSubfilter(next);
    router.replace(buildDesignsHref(category, next, searchQuery), { scroll: false });
  }

  const filterGroups = useMemo((): CatalogFilterGroup[] => {
    const groups: CatalogFilterGroup[] = [
      {
        kind: 'options',
        id: 'category',
        title: t('filterGroups.category'),
        allOption: { value: 'all', label: t('allCategories') },
        options: filterOptions,
        value: category,
        onChange: (value) => updateCategory(value as DesignCategory | 'all'),
      },
    ];

    if (category !== 'all' && subfilterOptions.length > 0) {
      groups.push({
        kind: 'options',
        id: 'subcategory',
        title: t('filterGroups.subcategory'),
        allOption: { value: 'all', label: t('allSubcategories') },
        options: subfilterOptions,
        value: subfilter,
        onChange: (value) => updateSubfilter(value as DesignSubfilterId | 'all'),
      });
    }

    return groups;
  }, [category, filterOptions, subfilter, subfilterOptions, t]);

  const filteredByCategory =
    category === 'all'
      ? designTemplates
      : designTemplates.filter((d) => d.category === category);

  const filteredBySubfilter = filterDesignsBySubfilter(
    filteredByCategory,
    subfilter,
    category === 'all' ? 'birthday' : category,
  );

  const filtered = filterDesignsBySearchQuery(
    filteredBySubfilter,
    deferredSearchQuery,
    searchLabels,
  );

  const fixedDesigns = filtered.filter((design) => design.kind === 'fixed');
  const customizableDesigns = filtered.filter(
    (design) => design.kind === 'customizable',
  );

  return (
    <CatalogFilterLayout
      groups={filterGroups}
      ariaLabel={t('filterLabel')}
      showFiltersLabel={t('showFilters')}
      hideFiltersLabel={t('hideFilters')}
      resultsCount={filtered.length}
      resultsLabel={(count) => t('resultsCount', { count })}
      searchQuery={searchQuery}
      onSearchChange={updateSearchQuery}
      searchPlaceholder={t('searchPlaceholder')}
      searchAriaLabel={t('searchAriaLabel')}
      searchClearLabel={ts('clear')}
    >
      <CatalogGridProvider defaultMobileColumns={1}>
        <CatalogGridToggle className="mb-6" />

        {fixedDesigns.length > 0 && (
          <section className="mb-12">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-ink-900">
                {t('fixedSectionTitle')}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-500">
                {t('fixedSectionDesc')}
              </p>
            </div>
            <CatalogGrid gapClassName="gap-6">
              {fixedDesigns.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  actionLabel={t('orderWithInfo')}
                  badgeLabel={t('fixedBadge')}
                />
              ))}
            </CatalogGrid>
          </section>
        )}

        {customizableDesigns.length > 0 && (
          <section>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-ink-900">
                {t('customizableSectionTitle')}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-ink-500">
                {t('customizableSectionDesc')}
              </p>
            </div>
            <CatalogGrid gapClassName="gap-6">
              {customizableDesigns.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  actionLabel={t('customizeOnline')}
                  badgeLabel={t('customizableBadge')}
                />
              ))}
            </CatalogGrid>
          </section>
        )}

        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-12 text-center text-sm text-ink-500">
            {t('noResults')}
          </p>
        ) : null}
      </CatalogGridProvider>
    </CatalogFilterLayout>
  );
}
