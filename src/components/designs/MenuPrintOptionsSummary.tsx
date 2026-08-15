'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import {
  MENU_PRINT_SIZE_MM,
  calculateMenuPrintPrice,
  type MenuPrintOptions,
} from '@/lib/designs/menu-print-options';

export function MenuPrintOptionsSummary({
  options,
  designFee = 0,
  className,
}: {
  options: MenuPrintOptions;
  designFee?: number;
  className?: string;
}) {
  const t = useTranslations('designs.order.menuPrintOptions');
  const tc = useTranslations('cart.menuPrint');
  const locale = useLocale();
  const price = calculateMenuPrintPrice(options, designFee);

  return (
    <div className={cn('space-y-4', className)}>
      <dl className="space-y-2 rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{tc('format')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {t('sku', { size: MENU_PRINT_SIZE_MM })}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{tc('pages')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {t('pagesValue', { pages: options.pages })}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{tc('paper')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {t(`paper.${options.paper}.title`)}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{tc('lamination')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {t(`lamination.${options.lamination}.title`)}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{tc('tirage')}:</dt>
          <dd className="min-w-0 font-medium text-ink-900">
            {t('quantityValue', { quantity: options.quantity })}
          </dd>
        </div>
      </dl>

      <dl className="rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-500">{t('unitPrice')}</dt>
          <dd className="font-medium text-ink-800">
            {formatPrice(price.unitTotal, locale)}
          </dd>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <dt className="text-ink-500">
            {t('printTotal', { quantity: price.quantity })}
          </dt>
          <dd className="font-medium text-ink-800">
            {formatPrice(price.printTotal, locale)}
          </dd>
        </div>
        {price.designFee > 0 ? (
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <dt className="text-ink-500">{t('designFee')}</dt>
            <dd className="font-medium text-ink-800">
              {formatPrice(price.designFee, locale)}
            </dd>
          </div>
        ) : null}
        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-ink-100 pt-3">
          <dt className="font-semibold text-ink-900">{t('total')}</dt>
          <dd className="text-lg font-bold text-ink-900">
            {formatPrice(price.total, locale)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
