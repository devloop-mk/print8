'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';
import { DesignCardThumbnail } from '@/components/designs/DesignCardThumbnail';
import { FilterChipBar } from '@/components/catalog/FilterChipBar';
import { CatalogGridLayout } from '@/components/catalog/CatalogGrid';
import {
  designCategories,
  getDesignHref,
  type DesignCategory,
  type DesignTemplate,
} from '@/lib/data/catalog';
import { getDesignThumbAspect } from '@/lib/designs/design-thumb';

const MAX_VISIBLE = 3;

type FeaturedDesign = DesignTemplate & {
  nameEn?: string;
  nameMk?: string;
};

function getFeaturedDesignName(
  design: FeaturedDesign,
  locale: string,
  fallback: (id: string) => string,
) {
  if (design.nameEn || design.nameMk) {
    return locale === 'mk'
      ? (design.nameMk ?? design.nameEn ?? design.id)
      : (design.nameEn ?? design.nameMk ?? design.id);
  }
  return fallback(design.id);
}

export function FeaturedDesignCards({ designs }: { designs: FeaturedDesign[] }) {
  const t = useTranslations('designs');
  const th = useTranslations('home');
  const locale = useLocale();

  const availableCategories = useMemo(() => {
    const cats = new Set(designs.map((design) => design.category));
    return designCategories.filter((cat) => cats.has(cat));
  }, [designs]);

  const [category, setCategory] = useState<DesignCategory | 'all'>('all');

  const filterOptions = useMemo(
    () =>
      availableCategories.map((cat) => ({
        value: cat,
        label: t(`categories.${cat}`),
      })),
    [availableCategories, t],
  );

  const filtered =
    category === 'all'
      ? designs
      : designs.filter((design) => design.category === category);

  const visible = filtered.slice(0, MAX_VISIBLE);

  const seeAllHref =
    category === 'all' ? '/designs/all' : `/designs/all?category=${category}`;

  return (
    <div className="space-y-6">
      <FilterChipBar
        ariaLabel={th('designFilterLabel')}
        showFiltersLabel={t('showFilters')}
        hideFiltersLabel={t('hideFilters')}
        allOption={{ value: 'all', label: t('allCategories') }}
        options={filterOptions}
        value={category}
        onChange={setCategory}
        resultsCount={filtered.length}
        resultsLabel={(count) => t('resultsCount', { count })}
      />

      {visible.length === 0 ? (
        <p className="border border-dashed border-ink-300 bg-ink-50 px-4 py-10 text-center text-sm text-ink-500">
          {th('noDesignsInCategory')}
        </p>
      ) : (
        <>
          <CatalogGridLayout gapClassName="gap-6" defaultMobileColumns={1}>
            {visible.map((design) => {
              const isFixed = design.kind === 'fixed';
              const displayName = getFeaturedDesignName(
                design,
                locale,
                (id) => t(`templates.${id}`),
              );
              return (
                <Link
                  key={design.id}
                  href={getDesignHref(design)}
                  className="group block"
                >
                  <Card className="overflow-hidden p-0 transition group-hover:shadow-md">
                    <div
                      className="relative flex items-center justify-center overflow-hidden bg-white p-1"
                      style={{ aspectRatio: getDesignThumbAspect(design) }}
                    >
                      <DesignCardThumbnail
                        design={design}
                        alt={displayName}
                      />
                      {!isFixed ? (
                        <span className="badge-brand absolute left-3 top-3 bg-white/95 shadow-sm">
                          {t('customizableBadge')}
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
                        {isFixed ? t('orderWithInfo') : t('customizeOnline')} →
                      </p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </CatalogGridLayout>

          {visible.length > 0 ? (
            <div className="flex justify-center pt-2">
              <Link
                href={seeAllHref}
                className="link-cta"
              >
                {th('viewAllDesigns')} →
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
