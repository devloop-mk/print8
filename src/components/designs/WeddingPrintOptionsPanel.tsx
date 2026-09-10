'use client';

import { useTranslations, useLocale } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import { QuantityInput } from '@/components/ui/QuantityInput';
import {
  WEDDING_MAX_QUANTITY,
  WEDDING_MIN_QUANTITY,
  WEDDING_PRINT_SIDES_OPTIONS,
  WEDDING_PRINT_SIZE_OPTIONS,
  calculateWeddingPrintPrice,
  clampWeddingQuantity,
  getWeddingPricePerInvitation,
  type WeddingPrintOptions,
  type WeddingPrintSides,
  type WeddingPrintSize,
} from '@/lib/designs/wedding-print-options';

export function WeddingPrintOptionsPanel({
  options,
  onChange,
  designFee = 0,
  defaultSides,
  className,
}: {
  options: WeddingPrintOptions;
  onChange: (options: WeddingPrintOptions) => void;
  designFee?: number;
  defaultSides?: WeddingPrintSides;
  className?: string;
}) {
  const t = useTranslations('designs.order.weddingPrint');
  const locale = useLocale();
  const price = calculateWeddingPrintPrice(options, designFee);

  function update(patch: Partial<WeddingPrintOptions>) {
    onChange({ ...options, ...patch });
  }

  return (
    <div className={cn('space-y-5', className)}>
      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">
          {t('sizeLabel')}
        </legend>
        <p className="mt-1 text-xs text-ink-500">{t('sizeHint')}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {WEDDING_PRINT_SIZE_OPTIONS.map((size: WeddingPrintSize) => {
            const selected = options.size === size;
            const unitPrice = getWeddingPricePerInvitation(
              size,
              options.sides,
              options.quantity,
            );
            return (
              <button
                key={size}
                type="button"
                onClick={() => update({ size })}
                aria-pressed={selected}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition',
                  selected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-ink-200 bg-white hover:border-brand-300',
                )}
              >
                <span className="block font-semibold text-ink-900">
                  {t(`sizes.${size}.title`)}
                </span>
                <span className="mt-0.5 block text-sm text-ink-500">
                  {t(`sizes.${size}.dimensions`)}
                </span>
                <span className="mt-1 block text-xs font-medium text-brand-700">
                  {t('pricePerUnit', { amount: formatPrice(unitPrice, locale) })}
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
          {WEDDING_PRINT_SIDES_OPTIONS.map((side) => {
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
          htmlFor="wedding-quantity"
          className="mb-1.5 block text-sm font-semibold text-ink-800"
        >
          {t('quantityLabel')}
        </label>
        <p className="text-xs text-ink-500">{t('quantityHint')}</p>
        <QuantityInput
          id="wedding-quantity"
          min={WEDDING_MIN_QUANTITY}
          max={WEDDING_MAX_QUANTITY}
          value={options.quantity}
          onChange={(quantity) =>
            update({ quantity: clampWeddingQuantity(quantity) })
          }
          className="mt-3 w-32"
        />
      </div>

      <div className="rounded-xl border border-ink-200 bg-ink-50/80 px-4 py-3 text-sm text-ink-700">
        {price.designFee > 0 ? (
          <p>
            {t('priceDesignFee', {
              amount: formatPrice(price.designFee, locale),
            })}
          </p>
        ) : null}
        <p className={price.designFee > 0 ? 'mt-1' : undefined}>
          {t('pricePerInvitation', {
            count: options.quantity,
            unit: formatPrice(price.pricePerInvitation, locale),
            print: formatPrice(price.printTotal, locale),
          })}
        </p>
        <p className="mt-2 text-base font-semibold text-ink-900">
          {t('priceTotal', { amount: formatPrice(price.total, locale) })}
        </p>
      </div>
    </div>
  );
}
