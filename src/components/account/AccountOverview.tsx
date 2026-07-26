'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { PointsBalanceCard } from '@/components/account/PointsBalanceCard';
import { OrdersList } from '@/components/account/OrdersList';
import { RewardsList } from '@/components/account/RewardsList';
import { isAccountRewardUsable } from '@/lib/coupons/coupon-lifecycle';
import {
  mergeAccountRewards,
  type AccountOrder,
  type AccountReward,
} from '@/components/account/types';

export function AccountOverview() {
  const t = useTranslations('account');
  const { customer } = useAuth();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [rewards, setRewards] = useState<AccountReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    void (async () => {
      try {
        const [ordersRes, rewardsRes] = await Promise.all([
          fetch('/api/account/orders', { cache: 'no-store' }),
          fetch('/api/account/rewards', { cache: 'no-store' }),
        ]);
        const ordersData = await ordersRes.json();
        const rewardsData = await rewardsRes.json();
        if (ordersRes.ok) {
          setOrders((ordersData.orders ?? []) as AccountOrder[]);
        }
        if (rewardsRes.ok) {
          setRewards(
            mergeAccountRewards(rewardsData.spinReward, rewardsData.coupons ?? []),
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [customer]);

  if (!customer) return null;

  const recentOrders = orders.slice(0, 3);
  const activeRewards = rewards.filter(isAccountRewardUsable).slice(0, 2);

  return (
    <div className="w-full min-w-0 space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold text-ink-900">{t('overviewTitle')}</h2>
        <p className="mt-1 text-sm text-ink-600">{t('overviewSubtitle')}</p>
      </div>

      <PointsBalanceCard customer={customer} compact />

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-ink-900">{t('recentOrders')}</h3>
          {orders.length > 0 ? (
            <Link
              href="/account/orders"
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              {t('viewAllOrders')}
            </Link>
          ) : null}
        </div>
        <div className="mt-3">
          {loading ? (
            <p className="text-sm text-ink-600">{t('loading')}</p>
          ) : recentOrders.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-600">{t('noOrders')}</p>
              <Link href="/products">
                <Button variant="outline" size="sm">{t('ctaProducts')}</Button>
              </Link>
            </div>
          ) : (
            <OrdersList orders={recentOrders} />
          )}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold text-ink-900">{t('activeRewards')}</h3>
          {rewards.length > 0 ? (
            <Link
              href="/account/rewards"
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              {t('viewAllRewards')}
            </Link>
          ) : null}
        </div>
        <div className="mt-3">
          {loading ? (
            <p className="text-sm text-ink-600">{t('loading')}</p>
          ) : (
            <RewardsList
              rewards={activeRewards}
              customerEmail={customer.email}
              emptyAction={
                <Link href="/rewards">
                  <Button variant="outline" size="sm">{t('spinWheelCta')}</Button>
                </Link>
              }
            />
          )}
        </div>
      </section>

      <p className="text-sm text-ink-600">
        <Link href="/checkout" className="font-semibold text-brand-700 hover:underline">
          {t('shopWithPoints')}
        </Link>
      </p>
    </div>
  );
}
