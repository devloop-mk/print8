'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Card } from '@/components/ui/Card';
import { DesignCardThumbnail } from '@/components/designs/DesignCardThumbnail';
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

  const filtered =
    category === 'all'
      ? designs
      : designs.filter((design) => design.category === category);

  const visible = filtered.slice(0, MAX_VISIBLE);
  const hasMore = filtered.length > MAX_VISIBLE;

  const seeAllHref =
    category === 'all' ? '/designs' : `/designs?category=${category}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label={th('designFilterLabel')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={category === 'all'}
            onClick={() => setCategory('all')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              category === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {t('allCategories')}
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={category === cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                category === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
              }`}
            >
              {t(`categories.${cat}`)}
            </button>
          ))}
        </div>

        <Link
          href={seeAllHref}
          className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          {th('seeAllDesigns')} →
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-10 text-center text-sm text-ink-500">
          {th('noDesignsInCategory')}
        </p>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((design) => (
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
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700 shadow-sm">
                      {t('customizableBadge')}
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
                      {t('customizeOnline')} →
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Link
                href={seeAllHref}
                className="rounded-full border border-brand-200 bg-brand-50 px-5 py-2 text-sm font-medium text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
              >
                {th('seeAllDesigns')} ({filtered.length})
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
