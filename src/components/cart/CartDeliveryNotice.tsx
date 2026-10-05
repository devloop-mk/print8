'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Truck } from 'lucide-react';
import { formatPrice, cn } from '@/lib/utils';
import {
  amountUntilFreeDeliveryMkd,
  FREE_DELIVERY_THRESHOLD_MKD,
  freeDeliveryProgressPercent,
  getOrderDeliveryFeeMkd,
} from '@/lib/orders/delivery-pricing';

export function CartDeliveryNotice({ subtotal }: { subtotal: number }) {
  const t = useTranslations('cart');
  const locale = useLocale();
  const deliveryFee = getOrderDeliveryFeeMkd({
    fulfillmentMethod: 'cargo',
    merchandiseSubtotalMkd: subtotal,
  });
  const remaining = amountUntilFreeDeliveryMkd(subtotal);
  const progress = freeDeliveryProgressPercent(subtotal);
  const thresholdLabel = formatPrice(FREE_DELIVERY_THRESHOLD_MKD, locale);
  const free = deliveryFee === 0;

  return (
    <div
      className={cn(
        'mt-4 rounded-xl border px-3 py-3',
        free
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-brand-200 bg-brand-50',
      )}
    >
      <div className="flex items-start gap-2.5">
        <Truck
          className={cn(
            'mt-0.5 h-5 w-5 shrink-0',
            free ? 'text-emerald-700' : 'text-brand-700',
          )}
          aria-hidden
        />
        <div className="min-w-0">
          {free ? (
            <>
              <p className="text-sm font-semibold text-emerald-900">
                {t('freeDeliveryTitle')}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
                {t('freeDeliveryBody', { threshold: thresholdLabel })}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-brand-900">
                {t('addMoreForFreeDelivery', {
                  amount: formatPrice(remaining, locale),
                })}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-brand-800">
                {t('deliveryFeeNote', {
                  fee: formatPrice(deliveryFee, locale),
                  threshold: thresholdLabel,
                })}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-ink-600">{t('pickupAlwaysFree')}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
