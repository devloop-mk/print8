'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
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

const MAX_VISIBLE = 3;

export function FeaturedDesignCards({ designs }: { designs: DesignTemplate[] }) {
  const t = useTranslations('designs');
  const th = useTranslations('home');

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
    category === 'all' ? '/designs' : `/designs?category=${category}`;

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
          <CatalogGridLayout gapClassName="gap-6">
            {visible.map((design) => {
              const isFixed = design.kind === 'fixed';
              return (
                <Link
                  key={design.id}
                  href={getDesignHref(design)}
                  className="group block"
                >
                  <Card className="overflow-hidden p-0 transition group-hover:shadow-md">
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-ink-50 to-ink-100">
                      <DesignCardThumbnail
                        design={design}
                        alt={t(`templates.${design.id}`)}
                      />
                      <span className="badge-brand absolute left-3 top-3 bg-white/95 shadow-sm">
                        {isFixed ? t('fixedBadge') : t('customizableBadge')}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                        {t(`categories.${design.category}`)}
                      </p>
                      <p className="mt-1 font-medium text-ink-900 group-hover:text-brand-700">
                        {t(`templates.${design.id}`)}
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
