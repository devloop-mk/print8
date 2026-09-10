'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import {
  calculateBusinessCardPrintPrice,
  type BusinessCardPrintOptions,
} from '@/lib/designs/business-card-print-options';

export function BusinessCardPrintOptionsSummary({
  options,
  designFee = 0,
  className,
}: {
  options: BusinessCardPrintOptions;
  designFee?: number;
  className?: string;
}) {
  const t = useTranslations('designs.order.printOptions');
  const locale = useLocale();
  const price = calculateBusinessCardPrintPrice(options, designFee);

  return (
    <div className={cn('space-y-4', className)}>
      <dl className="space-y-2 rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{t('paperLabel')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {t(`paper.${options.paper}.title`)}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{t('laminationLabel')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {t(`lamination.${options.lamination}.title`)}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{t('sidesLabel')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {t(`sides.${options.sides}.title`)}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{t('quantityLabel')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">{options.quantity}</dd>
        </div>
      </dl>

      <div className="rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-700">
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
