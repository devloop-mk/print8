'use client';

import { useTranslations } from 'next-intl';
import type { CartItem } from '@/lib/cart/types';
import {
  isBusinessCardCartItem,
  parseBusinessCardPrintOptions,
} from '@/lib/designs/business-card-print-options';

export function BusinessCardCartDetails({ item }: { item: CartItem }) {
  const t = useTranslations('designs.order.printOptions');
  const tc = useTranslations('cart.businessCard');

  if (!isBusinessCardCartItem(item)) return null;

  const { paper, lamination } = parseBusinessCardPrintOptions(item.metadata);

  return (
    <dl className="mt-3 space-y-1.5 rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2.5 text-sm">
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className="shrink-0 text-ink-500">{tc('paper')}:</dt>
        <dd className="min-w-0 font-medium text-ink-800">{t(`paper.${paper}`)}</dd>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className="shrink-0 text-ink-500">{tc('lamination')}:</dt>
        <dd className="min-w-0 font-medium text-ink-800">
          {t(`lamination.${lamination}.title`)}
        </dd>
      </div>
    </dl>
  );
}
