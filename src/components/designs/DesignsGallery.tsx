'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  designTemplates,
  designCategories,
  getDesignHref,
} from '@/lib/data/catalog';
import { parseDesignCategoryFilter } from '@/lib/data/service-routes';
import { Card } from '@/components/ui/Card';
import { DesignCardThumbnail } from '@/components/designs/DesignCardThumbnail';
import { FilterChipBar } from '@/components/catalog/FilterChipBar';
import type { DesignCategory, DesignTemplate } from '@/lib/data/catalog';

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
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-ink-50 to-ink-100">
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

export function DesignsGallery() {
  const t = useTranslations('designs');
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<DesignCategory | 'all'>(() =>
    parseDesignCategoryFilter(searchParams.get('category')),
  );

  useEffect(() => {
    setCategory(parseDesignCategoryFilter(searchParams.get('category')));
  }, [searchParams]);

  const filterOptions = useMemo(
    () =>
      designCategories.map((cat) => ({
        value: cat,
        label: t(`categories.${cat}`),
      })),
    [t],
  );

  const filtered =
    category === 'all'
      ? designTemplates
      : designTemplates.filter((d) => d.category === category);

  const fixedDesigns = filtered.filter((design) => design.kind === 'fixed');
  const customizableDesigns = filtered.filter(
    (design) => design.kind === 'customizable',
  );

  return (
    <>
      <FilterChipBar
        ariaLabel={t('filterLabel')}
        showFiltersLabel={t('showFilters')}
        hideFiltersLabel={t('hideFilters')}
        allOption={{ value: 'all', label: t('allCategories') }}
        options={filterOptions}
        value={category}
        onChange={setCategory}
        resultsCount={filtered.length}
        resultsLabel={(count) => t('resultsCount', { count })}
      />

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fixedDesigns.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                actionLabel={t('orderWithInfo')}
                badgeLabel={t('fixedBadge')}
              />
            ))}
          </div>
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {customizableDesigns.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                actionLabel={t('customizeOnline')}
                badgeLabel={t('customizableBadge')}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
