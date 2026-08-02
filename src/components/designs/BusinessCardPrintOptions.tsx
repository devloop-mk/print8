'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  BUSINESS_CARD_LAMINATION_OPTIONS,
  BUSINESS_CARD_PAPER_OPTIONS,
  type BusinessCardLamination,
  type BusinessCardPaper,
} from '@/lib/designs/business-card-print-options';

export function BusinessCardPrintOptions({
  paper,
  lamination,
  onPaperChange,
  onLaminationChange,
  className,
}: {
  paper: BusinessCardPaper;
  lamination: BusinessCardLamination;
  onPaperChange: (value: BusinessCardPaper) => void;
  onLaminationChange: (value: BusinessCardLamination) => void;
  className?: string;
}) {
  const t = useTranslations('designs.order.printOptions');

  return (
    <div className={cn('space-y-5', className)}>
      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">
          {t('paperLabel')}
        </legend>
        <p className="mt-1 text-xs text-ink-500">{t('paperHint')}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {BUSINESS_CARD_PAPER_OPTIONS.map((option) => {
            const selected = paper === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onPaperChange(option)}
                aria-pressed={selected}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition',
                  selected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-ink-200 bg-white hover:border-brand-300',
                )}
              >
                <span className="block font-semibold text-ink-900">
                  {t(`paper.${option}`)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">
          {t('laminationLabel')}
        </legend>
        <p className="mt-1 text-xs text-ink-500">{t('laminationHint')}</p>
        <div className="mt-3 grid gap-2">
          {BUSINESS_CARD_LAMINATION_OPTIONS.map((option) => {
            const selected = lamination === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onLaminationChange(option)}
                aria-pressed={selected}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition',
                  selected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-ink-200 bg-white hover:border-brand-300',
                )}
              >
                <span className="block font-semibold text-ink-900">
                  {t(`lamination.${option}.title`)}
                </span>
                <span className="mt-0.5 block text-sm text-ink-500">
                  {t(`lamination.${option}.description`)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
