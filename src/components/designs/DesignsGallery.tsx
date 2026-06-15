'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { designTemplates, designCategories } from '@/lib/data/catalog';
import { Card } from '@/components/ui/Card';
import { Palette } from 'lucide-react';
import type { DesignCategory } from '@/lib/data/catalog';

export function DesignsGallery() {
  const t = useTranslations('designs');
  const [category, setCategory] = useState<DesignCategory | 'all'>('all');

  const filtered =
    category === 'all'
      ? designTemplates
      : designTemplates.filter((d) => d.category === category);

  return (
    <>
      <div
        className="mb-8 flex flex-wrap gap-2"
        role="tablist"
        aria-label={t('allCategories')}
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
        {designCategories.map((cat) => (
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

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((design) => (
          <Link
            key={design.id}
            href={`/designs/${design.id}`}
            className="group block"
          >
            <Card className="overflow-hidden p-0 transition group-hover:shadow-md">
              <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-ink-50 to-ink-100">
                {design.image ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={design.image}
                      alt={t(`templates.${design.id}`)}
                      fill
                      sizes="320px"
                      className="object-contain p-4 transition group-hover:scale-[1.02]"
                    />
                  </div>
                ) : (
                  <Palette className="h-16 w-16 text-ink-400" aria-hidden="true" />
                )}
              </div>
              <div className="p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
                  {t(`categories.${design.category}`)}
                </p>
                <p className="mt-1 font-medium text-ink-900 group-hover:text-brand-700">
                  {t(`templates.${design.id}`)}
                </p>
                <p className="mt-3 text-sm font-medium text-brand-600">
                  {t('orderWithInfo')} →
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
