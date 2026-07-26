'use client';

import { useTranslations, useLocale } from 'next-intl';
import { formatPrice } from '@/lib/utils';
import type { AccountOrder } from '@/components/account/types';

export function OrdersList({ orders }: { orders: AccountOrder[] }) {
  const t = useTranslations('account');
  const locale = useLocale();

  if (orders.length === 0) {
    return <p className="text-sm text-ink-600">{t('noOrders')}</p>;
  }

  return (
    <ul className="w-full min-w-0 divide-y divide-ink-200 border border-ink-200 bg-white">
      {orders.map((order) => {
        const isPendingEarn =
          order.pointsEarned != null &&
          order.pointsEarned > 0 &&
          !order.pointsAwardedAt &&
          order.status !== 'cancelled';

        return (
          <li
            key={order.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div>
              <p className="font-semibold text-ink-900">{order.orderNumber}</p>
              <p className="text-sm text-ink-600">
                {new Date(order.createdAt).toLocaleDateString(locale)}
                {' · '}
                {t(`orderStatus.${order.status}` as 'orderStatus.pending')}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold text-ink-900">
                {formatPrice(order.totalAmount, locale)}
              </p>
              {order.pointsRedeemed > 0 ? (
                <p className="text-ink-600">{t('pointsUsed', { count: order.pointsRedeemed })}</p>
              ) : null}
              {isPendingEarn ? (
                <p className="text-amber-700">
                  {t('pointsPendingEarn', { count: order.pointsEarned ?? 0 })}
                </p>
              ) : null}
              {order.pointsAwardedAt &&
              order.pointsEarned != null &&
              order.pointsEarned > 0 ? (
                <p className="text-brand-700">
                  {t('pointsEarned', { count: order.pointsEarned })}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
