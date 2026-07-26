'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';
import type { AccountCustomer } from '@/components/auth/AuthProvider';
import {
  LOYALTY_POINTS_PER_100_MKD,
  LOYALTY_POINT_MKDISCOUNT_VALUE,
} from '@/lib/loyalty/constants';

type PointsBalanceCardProps = {
  customer: AccountCustomer;
  compact?: boolean;
};

export function PointsBalanceCard({ customer, compact = false }: PointsBalanceCardProps) {
  const t = useTranslations('account');

  return (
    <Card className="w-full min-w-0 border-brand-200 bg-brand-50/50 p-6">
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
      {!compact ? (
        <>
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
        </>
      ) : null}
    </Card>
  );
}
