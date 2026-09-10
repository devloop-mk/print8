'use client';

import { useTranslations, useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/lib/cart/types';
import {
  calculateWeddingPrintPrice,
  isWeddingPrintCartItem,
  parseWeddingPrintOptions,
} from '@/lib/designs/wedding-print-options';

export function WeddingPrintCartDetails({ item }: { item: CartItem }) {
  const t = useTranslations('designs.order.weddingPrint');
  const tc = useTranslations('cart.weddingPrint');
  const locale = useLocale();

  if (!isWeddingPrintCartItem(item)) return null;

  const options = parseWeddingPrintOptions(item.metadata);
  const price = calculateWeddingPrintPrice(
    options,
    typeof item.metadata?.weddingDesignFee === 'number'
      ? item.metadata.weddingDesignFee
      : 0,
  );

  return (
    <dl className="mt-3 space-y-1.5 rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2.5 text-sm">
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className="shrink-0 text-ink-500">{tc('size')}:</dt>
        <dd className="min-w-0 font-medium text-ink-800">
          {t(`sizes.${options.size}.title`)}
        </dd>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className="shrink-0 text-ink-500">{tc('sides')}:</dt>
        <dd className="min-w-0 font-medium text-ink-800">
          {t(`sides.${options.sides}.title`)}
        </dd>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5">
        <dt className="shrink-0 text-ink-500">{tc('quantity')}:</dt>
        <dd className="min-w-0 font-medium text-ink-800">{options.quantity}</dd>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 border-t border-ink-100 pt-1.5">
        <dt className="shrink-0 text-ink-500">{tc('printTotal')}:</dt>
        <dd className="min-w-0 font-medium text-ink-800">
          {formatPrice(price.printTotal, locale)}
        </dd>
      </div>
    </dl>
  );
}
