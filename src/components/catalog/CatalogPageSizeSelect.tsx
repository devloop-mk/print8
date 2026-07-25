'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type CatalogPageSizeSelectProps = {
  value: number;
  onChange: (value: number) => void;
  options: readonly number[];
  className?: string;
};

export function CatalogPageSizeSelect({
  value,
  onChange,
  options,
  className,
}: CatalogPageSizeSelectProps) {
  const t = useTranslations('products.catalog.pageSize');

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
        onChange={(event) => onChange(Number.parseInt(event.target.value, 10))}
        aria-label={t('label')}
        className="max-w-[11.5rem] rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-2 text-sm font-medium text-ink-800 outline-none transition hover:border-ink-300 focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-500/30 sm:max-w-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {t('option', { count: option })}
          </option>
        ))}
      </select>
    </label>
  );
}
