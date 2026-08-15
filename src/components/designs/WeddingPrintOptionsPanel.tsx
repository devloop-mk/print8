'use client';

import { useTranslations, useLocale } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import { QuantityInput } from '@/components/ui/QuantityInput';
import {
  WEDDING_PRINT_SIZE_OPTIONS,
  calculateWeddingPrintPrice,
  getWeddingPricePerInvitation,
  type WeddingPrintOptions,
} from '@/lib/designs/wedding-print-options';

export function WeddingPrintOptionsPanel({
  options,
  onChange,
  className,
}: {
  options: WeddingPrintOptions;
  onChange: (options: WeddingPrintOptions) => void;
  className?: string;
}) {
  const t = useTranslations('designs.order.weddingPrint');
  const locale = useLocale();
  const price = calculateWeddingPrintPrice(options);

  return (
    <div className={cn('space-y-5', className)}>
      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">
          {t('sizeLabel')}
        </legend>
        <p className="mt-1 text-xs text-ink-500">{t('sizeHint')}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {WEDDING_PRINT_SIZE_OPTIONS.map((size) => {
            const selected = options.size === size;
            const unitPrice = getWeddingPricePerInvitation(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => onChange({ ...options, size })}
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
          min={1}
          max={999}
          value={options.quantity}
          onChange={(quantity) => onChange({ ...options, quantity })}
          className="mt-3 w-32"
        />
      </div>

      <div className="rounded-xl border border-ink-200 bg-ink-50/80 px-4 py-3 text-sm text-ink-700">
        <p>
          {t('priceDesignFee', {
            amount: formatPrice(price.designFee, locale),
          })}
        </p>
        <p className="mt-1">
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
