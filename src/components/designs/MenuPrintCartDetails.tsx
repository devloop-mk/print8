'use client';

import { useTranslations } from 'next-intl';
import type { CartItem } from '@/lib/cart/types';
import {
  MENU_PRINT_SIZE_MM,
  isMenuPrintCartItem,
  parseMenuPrintOptions,
  supportsMenuLamination,
} from '@/lib/designs/menu-print-options';

export function MenuPrintCartDetails({ item }: { item: CartItem }) {
  const t = useTranslations('designs.order.menuPrintOptions');
  const tc = useTranslations('cart.menuPrint');

  if (!isMenuPrintCartItem(item)) return null;

  const options = parseMenuPrintOptions(item.metadata);

  return (
    <dl className="mt-3 space-y-1.5 rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2.5 text-sm">
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className="shrink-0 text-ink-500">{tc('format')}:</dt>
        <dd className="min-w-0 font-medium text-ink-800">
          {t('sku', { size: MENU_PRINT_SIZE_MM })}
        </dd>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className="shrink-0 text-ink-500">{tc('pages')}:</dt>
        <dd className="min-w-0 font-medium text-ink-800">
          {t('pagesValue', { pages: options.pages })}
        </dd>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className="shrink-0 text-ink-500">{tc('paper')}:</dt>
        <dd className="min-w-0 font-medium text-ink-800">
          {t(`paper.${options.paper}.title`)}
        </dd>
      </div>
      {supportsMenuLamination(options.paper) ? (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="shrink-0 text-ink-500">{tc('lamination')}:</dt>
          <dd className="min-w-0 font-medium text-ink-800">
            {t(`lamination.${options.lamination}.title`)}
          </dd>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className="shrink-0 text-ink-500">{tc('tirage')}:</dt>
        <dd className="min-w-0 font-medium text-ink-800">
          {t('quantityValue', { quantity: options.quantity })}
        </dd>
      </div>
    </dl>
  );
}
