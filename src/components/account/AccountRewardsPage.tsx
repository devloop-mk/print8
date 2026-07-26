'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { RewardsList } from '@/components/account/RewardsList';
import { mergeAccountRewards, type AccountReward } from '@/components/account/types';

export function AccountRewardsPage() {
  const t = useTranslations('account');
  const { customer } = useAuth();
  const [rewards, setRewards] = useState<AccountReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    void (async () => {
      try {
        const res = await fetch('/api/account/rewards', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) {
          setRewards(mergeAccountRewards(data.spinReward, data.coupons ?? []));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [customer]);

  return (
    <div className="w-full min-w-0 space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink-900">{t('rewardsTitle')}</h2>
        <p className="mt-1 text-sm text-ink-600">{t('rewardsSubtitle')}</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-600">{t('loading')}</p>
      ) : (
        <RewardsList
          rewards={rewards}
          customerEmail={customer?.email}
          emptyAction={
            <Link href="/rewards">
              <Button variant="outline" size="sm">{t('spinWheelCta')}</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
