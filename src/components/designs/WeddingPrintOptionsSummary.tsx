'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import {
  calculateWeddingPrintPrice,
  type WeddingPrintOptions,
} from '@/lib/designs/wedding-print-options';

export function WeddingPrintOptionsSummary({
  options,
  className,
}: {
  options: WeddingPrintOptions;
  className?: string;
}) {
  const t = useTranslations('designs.order.weddingPrint');
  const locale = useLocale();
  const price = calculateWeddingPrintPrice(options);

  return (
    <div className={cn('space-y-4', className)}>
      <dl className="space-y-2 rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{t('sizeLabel')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {t(`sizes.${options.size}.title`)} —{' '}
            {t(`sizes.${options.size}.dimensions`)}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{t('quantityLabel')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {options.quantity}
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-700">
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
