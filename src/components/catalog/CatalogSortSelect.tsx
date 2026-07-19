'use client';

import { useTranslations } from 'next-intl';
import {
  DESIGN_CATALOG_SORT_OPTIONS,
  type DesignCatalogSort,
} from '@/lib/products/design-catalog-sort';
import { cn } from '@/lib/utils';

type CatalogSortSelectProps = {
  value: DesignCatalogSort;
  onChange: (value: DesignCatalogSort) => void;
  className?: string;
};

export function CatalogSortSelect({
  value,
  onChange,
  className,
}: CatalogSortSelectProps) {
  const t = useTranslations('products.catalog.sort');

  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 text-sm text-ink-600',
        className,
      )}
    >
      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
        {t('label')}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as DesignCatalogSort)}
        aria-label={t('label')}
        className="max-w-[11.5rem] rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-2 text-sm font-medium text-ink-800 outline-none transition hover:border-ink-300 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-500/30 sm:max-w-none"
      >
        {DESIGN_CATALOG_SORT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {t(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
