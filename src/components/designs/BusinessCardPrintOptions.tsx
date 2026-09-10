'use client';

import { useTranslations, useLocale } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import { QuantityInput } from '@/components/ui/QuantityInput';
import {
  BUSINESS_CARD_MAX_QUANTITY,
  BUSINESS_CARD_MIN_QUANTITY,
  BUSINESS_CARD_STANDARD_TIERS,
  calculateBusinessCardPrintPrice,
  clampBusinessCardQuantity,
  resolveBusinessCardLamination,
  supportsBusinessCardLamination,
  BUSINESS_CARD_LAMINATION_OPTIONS,
  BUSINESS_CARD_PAPER_OPTIONS,
  type BusinessCardLamination,
  type BusinessCardPaper,
  type BusinessCardPrintOptions,
  type BusinessCardSides,
} from '@/lib/designs/business-card-print-options';

export function BusinessCardPrintOptions({
  options,
  onChange,
  designFee = 0,
  defaultSides,
  className,
}: {
  options: BusinessCardPrintOptions;
  onChange: (options: BusinessCardPrintOptions) => void;
  designFee?: number;
  /** When set, pre-selects sides on first render if still at default. */
  defaultSides?: BusinessCardSides;
  className?: string;
}) {
  const t = useTranslations('designs.order.printOptions');
  const locale = useLocale();
  const price = calculateBusinessCardPrintPrice(options, designFee);
  const laminationEnabled = supportsBusinessCardLamination(options.paper);

  function update(patch: Partial<BusinessCardPrintOptions>) {
    const next = { ...options, ...patch };
    if (patch.paper && !supportsBusinessCardLamination(patch.paper)) {
      next.lamination = 'none';
    }
    next.lamination = resolveBusinessCardLamination(next);
    onChange(next);
  }

  return (
    <div className={cn('space-y-5', className)}>
      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">
          {t('paperLabel')}
        </legend>
        <p className="mt-1 text-xs text-ink-500">{t('paperHint')}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {BUSINESS_CARD_PAPER_OPTIONS.map((option) => {
            const selected = options.paper === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => update({ paper: option })}
                aria-pressed={selected}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition',
                  selected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-ink-200 bg-white hover:border-brand-300',
                )}
              >
                <span className="block font-semibold text-ink-900">
                  {t(`paper.${option}.title`)}
                </span>
                <span className="mt-0.5 block text-sm text-ink-500">
                  {t(`paper.${option}.description`)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset disabled={!laminationEnabled}>
        <legend className="text-sm font-semibold text-ink-800">
          {t('laminationLabel')}
        </legend>
        <p className="mt-1 text-xs text-ink-500">
          {laminationEnabled ? t('laminationHint') : t('laminationDisabledHint')}
        </p>
        <div className="mt-3 grid gap-2">
          {BUSINESS_CARD_LAMINATION_OPTIONS.map((option) => {
            const selected = options.lamination === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => update({ lamination: option })}
                aria-pressed={selected}
                disabled={!laminationEnabled}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition',
                  selected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-ink-200 bg-white hover:border-brand-300',
                  !laminationEnabled && 'cursor-not-allowed opacity-60',
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

      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">
          {t('sidesLabel')}
        </legend>
        <p className="mt-1 text-xs text-ink-500">{t('sidesHint')}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {(['single', 'double'] as const).map((side) => {
            const selected = options.sides === side;
            return (
              <button
                key={side}
                type="button"
                onClick={() => update({ sides: side })}
                aria-pressed={selected}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition',
                  selected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-ink-200 bg-white hover:border-brand-300',
                )}
              >
                <span className="block font-semibold text-ink-900">
                  {t(`sides.${side}.title`)}
                </span>
                <span className="mt-0.5 block text-sm text-ink-500">
                  {t(`sides.${side}.description`)}
                </span>
              </button>
            );
          })}
        </div>
        {defaultSides && defaultSides !== options.sides ? (
          <button
            type="button"
            className="mt-2 text-xs font-medium text-brand-700 hover:underline"
            onClick={() => update({ sides: defaultSides })}
          >
            {t('sidesUseTemplate', { side: t(`sides.${defaultSides}.title`) })}
          </button>
        ) : null}
      </fieldset>

      <div>
        <label
          htmlFor="bcard-quantity"
          className="mb-1.5 block text-sm font-semibold text-ink-800"
        >
          {t('quantityLabel')}
        </label>
        <p className="text-xs text-ink-500">{t('quantityHint')}</p>
        <QuantityInput
          id="bcard-quantity"
          min={BUSINESS_CARD_MIN_QUANTITY}
          max={BUSINESS_CARD_MAX_QUANTITY}
          value={options.quantity}
          onChange={(quantity) =>
            update({ quantity: clampBusinessCardQuantity(quantity) })
          }
          className="mt-3 w-32"
        />
        <p className="mt-2 text-xs text-ink-500">
          {t('quantityTiers', {
            tiers: BUSINESS_CARD_STANDARD_TIERS.join(', '),
          })}
        </p>
      </div>

      <div className="rounded-xl border border-ink-200 bg-ink-50/80 px-4 py-3 text-sm text-ink-700">
        <p>
          {t('printTotal', {
            quantity: price.quantity,
            amount: formatPrice(price.tirageTotal, locale),
          })}
        </p>
        {price.designFee > 0 ? (
          <p className="mt-1">
            {t('designFee', {
              amount: formatPrice(price.designFee, locale),
            })}
          </p>
        ) : null}
        <p className="mt-2 text-base font-semibold text-ink-900">
          {t('total', { amount: formatPrice(price.total, locale) })}
        </p>
      </div>
    </div>
  );
}
