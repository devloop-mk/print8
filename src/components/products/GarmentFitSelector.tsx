'use client';

import { useTranslations } from 'next-intl';
import type { GarmentFit } from '@/lib/data/catalog';
import { GARMENT_FIT_ORDER } from '@/lib/products/garment-fit';
import { cn } from '@/lib/utils';

export function GarmentFitSelector({
  fits,
  value,
  onChange,
  className,
}: {
  fits: GarmentFit[];
  value: GarmentFit;
  onChange: (fit: GarmentFit) => void;
  className?: string;
}) {
  const t = useTranslations('products.garmentFit');

  if (fits.length <= 1) return null;

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-ink-700">
        {t('label')}
      </label>
      <div className="flex flex-wrap gap-2">
        {GARMENT_FIT_ORDER.filter((fit) => fits.includes(fit)).map((fit) => (
          <button
            key={fit}
            type="button"
            onClick={() => onChange(fit)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition',
              value === fit
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
            )}
          >
            {t(fit)}
          </button>
        ))}
      </div>
    </div>
  );
}
