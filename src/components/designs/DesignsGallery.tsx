'use client';

import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { Palette } from 'lucide-react';
import {
  designCategories,
  getDesignHref,
  type DesignCategory,
  type DesignTemplate,
} from '@/lib/data/catalog';
import { getDesignDisplayName } from '@/lib/catalog/design-catalog';
import type { GalleryDesignTemplate } from '@/lib/catalog/slim-design-template';
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
  getCatalogItemClassName,
  useOptionalCatalogGrid,
} from '@/components/catalog/CatalogGrid';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { useCatalogPagination } from '@/hooks/useCatalogPagination';
import { parseCatalogPage, DESIGN_GALLERY_PAGE_SIZE } from '@/lib/catalog/pagination';
import { cn } from '@/lib/utils';
import type { ManagedSvgTemplateDefaultsPayload } from '@/lib/db/managed-svg-templates';

const DesignCard = memo(function DesignCard({
  design,
  actionLabel,
  badgeLabel,
  displayName,
  svgDefaultsMap,
  svgThumbVersions,
}: {
  design: DesignTemplate;
  actionLabel: string;
  badgeLabel?: string;
  displayName: string;
  svgDefaultsMap?: Record<string, ManagedSvgTemplateDefaultsPayload>;
  svgThumbVersions?: Record<string, string>;
}) {
  const t = useTranslations('designs');
  const grid = useOptionalCatalogGrid();

  return (
    <Link
      href={getDesignHref(design)}
      prefetch={false}
      className={cn('group block', getCatalogItemClassName(grid))}
    >
      <Card className="overflow-hidden p-0 transition group-hover:shadow-md">
        <div
          className="relative flex items-center justify-center overflow-hidden bg-white p-1"
          style={{ aspectRatio: getDesignThumbAspect(design) }}
        >
          <DesignCardThumbnail
            design={design}
            alt={displayName}
            previewMode="lazy"
            svgDefaultsMap={svgDefaultsMap}
            svgThumbVersions={svgThumbVersions}
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
            {displayName}
          </p>
          <p className="mt-3 text-sm font-medium text-brand-600">
            {actionLabel} →
          </p>
        </div>
      </Card>
    </Link>
  );
});

function buildDesignsHref(
  category: DesignCategory | 'all',
  subfilter: DesignSubfilterId | 'all',
  query = '',
  page?: number,
): string {
  const params = new URLSearchParams();
  if (category !== 'all') params.set('category', category);
  if (subfilter !== 'all' && category !== 'all') {
    params.set('tag', subfilter);
  }
  const trimmed = query.trim();
  if (trimmed) params.set('q', trimmed);
  if (page && page > 1) params.set('page', String(page));
  const queryString = params.toString();
  return queryString ? `/designs/all?${queryString}` : '/designs/all';
}

export function DesignsGallery({
  designs,
  svgDefaultsMap,
  svgThumbVersions,
}: {
  designs: GalleryDesignTemplate[];
  svgDefaultsMap?: Record<string, ManagedSvgTemplateDefaultsPayload>;
  svgThumbVersions?: Record<string, string>;
}) {
  const t = useTranslations('designs');
  const locale = useLocale() as 'mk' | 'en';
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
      designs,
    ),
  );
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');

  useEffect(() => {
    const nextCategory = parseDesignCategoryFilter(searchParams.get('category'));
    setCategory(nextCategory);
    setSubfilter(
      parseDesignSubfilterFilter(searchParams.get('tag'), nextCategory, designs),
    );
    setSearchQuery(searchParams.get('q') ?? '');
  }, [designs, searchParams]);

  const updateSearchQuery = useCallback((nextQuery: string) => {
    setSearchQuery(nextQuery);
  }, []);

  const currentPage = parseCatalogPage(searchParams.get('page'));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const paramsQuery = searchParams.get('q') ?? '';
      if (searchQuery === paramsQuery) return;
      router.replace(
        buildDesignsHref(category, subfilter, searchQuery, currentPage),
        { scroll: false },
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [category, currentPage, router, searchParams, searchQuery, subfilter]);

  const filterOptions = useMemo(
    () =>
      designCategories.map((cat) => ({
        value: cat,
        label: t(`categories.${cat}`),
      })),
    [t],
  );

  const availableSubfilters = useMemo(
    () => (category === 'all' ? [] : getAvailableDesignSubfilters(category, designs)),
    [category, designs],
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
      ? designs
      : designs.filter((d) => d.category === category);

  const filteredBySubfilter = filterDesignsBySubfilter(
    filteredByCategory,
    subfilter,
    category === 'all' ? 'birthday' : category,
  );

  const filtered = filterDesignsBySearchQuery(
    filteredBySubfilter,
    searchQuery,
    searchLabels,
  );

  const fixedDesigns = filtered.filter((design) => design.kind === 'fixed');
  const customizableDesigns = filtered.filter(
    (design) => design.kind === 'customizable',
  );

  const { page, setPage, paginate } = useCatalogPagination({
    totalItems:
      fixedDesigns.length > 0 ? fixedDesigns.length : customizableDesigns.length,
    pageSize: DESIGN_GALLERY_PAGE_SIZE,
  });

  const visibleFixedDesigns = useMemo(
    () => paginate(fixedDesigns),
    [fixedDesigns, paginate],
  );

  const visibleCustomizableDesigns = useMemo(
    () =>
      fixedDesigns.length > 0
        ? customizableDesigns
        : paginate(customizableDesigns),
    [customizableDesigns, fixedDesigns.length, paginate],
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
              {visibleFixedDesigns.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  displayName={
                    getDesignDisplayName(design, locale) !== design.id
                      ? getDesignDisplayName(design, locale)
                      : t(`templates.${design.id}`)
                  }
                  actionLabel={t('orderWithInfo')}
                  svgDefaultsMap={svgDefaultsMap}
                  svgThumbVersions={svgThumbVersions}
                />
              ))}
            </CatalogGrid>
            <CatalogPagination
              page={page}
              totalItems={fixedDesigns.length}
              pageSize={DESIGN_GALLERY_PAGE_SIZE}
              onPageChange={setPage}
              previousLabel={t('paginationPrevious')}
              nextLabel={t('paginationNext')}
              pageLabel={(current, total) =>
                t('paginationPage', { current, total })
              }
            />
          </section>
        )}

        {customizableDesigns.length > 0 && (
          <div className={cn(fixedDesigns.length > 0 && 'mt-14')}>
            <section className="relative -mx-4 overflow-hidden border-y-2 border-brand-300 bg-brand-100 px-4 py-12 sm:-mx-6 sm:px-8 lg:-mx-8 lg:px-10">
              <div
                className="pointer-events-none absolute inset-0 bg-grid opacity-30"
                aria-hidden
              />
              <div className="relative">
                <div className="mb-8 flex gap-4 sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-brand-700 bg-brand-600 text-white shadow-lift-brand">
                    <Palette className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="badge-brand w-fit border border-brand-200 bg-white px-2.5 py-1">
                      {t('customizableBadge')}
                    </p>
                    <h2 className="mt-3 text-2xl font-bold text-ink-900">
                      {t('customizableSectionTitle')}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-700">
                      {t('customizableSectionDesc')}
                    </p>
                  </div>
                </div>
                <CatalogGrid gapClassName="gap-6">
                  {visibleCustomizableDesigns.map((design) => (
                    <DesignCard
                      key={design.id}
                      design={design}
                      displayName={
                        getDesignDisplayName(design, locale) !== design.id
                          ? getDesignDisplayName(design, locale)
                          : t(`templates.${design.id}`)
                      }
                      actionLabel={t('customizeOnline')}
                      badgeLabel={t('customizableBadge')}
                      svgDefaultsMap={svgDefaultsMap}
                      svgThumbVersions={svgThumbVersions}
                    />
                  ))}
                </CatalogGrid>
                {fixedDesigns.length === 0 ? (
                  <CatalogPagination
                    page={page}
                    totalItems={customizableDesigns.length}
                    pageSize={DESIGN_GALLERY_PAGE_SIZE}
                    onPageChange={setPage}
                    previousLabel={t('paginationPrevious')}
                    nextLabel={t('paginationNext')}
                    pageLabel={(current, total) =>
                      t('paginationPage', { current, total })
                    }
                  />
                ) : null}
              </div>
            </section>
          </div>
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
