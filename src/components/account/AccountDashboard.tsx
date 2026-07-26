'use client';

import { Suspense, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { EmailConfirmedNotice } from '@/components/auth/EmailConfirmedNotice';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import {
  LOYALTY_POINTS_PER_100_MKD,
  LOYALTY_POINT_MKDISCOUNT_VALUE,
} from '@/lib/loyalty/constants';

type AccountOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  pointsRedeemed: number;
  pointsEarned: number | null;
  pointsAwardedAt: string | null;
  createdAt: string;
};

type PointTransaction = {
  id: string;
  type: string;
  points: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
};

export function AccountDashboard() {
  const t = useTranslations('account');
  const locale = useLocale();
  const { customer, logout } = useAuth();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    void (async () => {
      try {
        const res = await fetch('/api/account/orders', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) {
          setOrders(data.orders ?? []);
          setTransactions(data.transactions ?? []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [customer]);

  if (!customer) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <Suspense fallback={null}>
        <EmailConfirmedNotice />
      </Suspense>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">{t('title')}</h1>
          <p className="mt-1 text-ink-600">{customer.email}</p>
        </div>
        <Button variant="outline" onClick={() => void logout()}>
          {t('logout')}
        </Button>
      </div>

      <Card className="border-brand-200 bg-brand-50/50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-800">
          {t('pointsBalance')}
        </p>
        <p className="mt-2 font-display text-4xl font-bold text-brand-900">
          {customer.pointsBalance} {t('points')}
        </p>
        <p className="mt-1 text-sm text-ink-600">{t('pointsReadyToUse')}</p>
        {customer.pointsPendingBalance > 0 ? (
          <p className="mt-3 text-sm font-medium text-amber-800">
            {t('pointsPending', { count: customer.pointsPendingBalance })}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-ink-700">
          {t('pointsEarnRule', { points: LOYALTY_POINTS_PER_100_MKD })}
        </p>
        <p className="text-sm text-ink-700">
          {t('pointsRedeemRule', { value: LOYALTY_POINT_MKDISCOUNT_VALUE })}
        </p>
        {!customer.firstOrderBonusGranted ? (
          <p className="mt-2 text-sm font-medium text-brand-800">
            {t('firstOrderBonusHint')}
          </p>
        ) : null}
        <p className="mt-4 text-sm">
          <Link
            href="/loyalty-points"
            className="font-semibold text-brand-700 hover:underline"
          >
            {t('pointsLearnMore')}
          </Link>
        </p>
      </Card>

      <section>
        <h2 className="font-display text-xl font-bold text-ink-900">{t('ordersTitle')}</h2>
        {loading ? (
          <p className="mt-3 text-sm text-ink-600">{t('loading')}</p>
        ) : orders.length === 0 ? (
          <p className="mt-3 text-sm text-ink-600">{t('noOrders')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-200 border border-ink-200 bg-white">
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
                      <p className="text-ink-600">
                        {t('pointsUsed', { count: order.pointsRedeemed })}
                      </p>
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
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink-900">{t('historyTitle')}</h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-ink-600">{t('noHistory')}</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-200 border border-ink-200 bg-white">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-900">
                    {t(`txType.${tx.type}` as 'txType.earn')}
                  </p>
                  {tx.note ? <p className="text-ink-600">{tx.note}</p> : null}
                </div>
                <p
                  className={
                    tx.points > 0
                      ? 'font-semibold text-brand-700'
                      : 'font-semibold text-ink-900'
                  }
                >
                  {tx.points > 0 ? `+${tx.points}` : tx.points}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-ink-600">
        <Link href="/checkout" className="font-semibold text-brand-700 hover:underline">
          {t('shopWithPoints')}
        </Link>
      </p>
    </div>
  );
}
