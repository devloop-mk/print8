'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { PointsBalanceCard } from '@/components/account/PointsBalanceCard';
import { PointsHistoryList } from '@/components/account/PointsHistoryList';
import type { PointTransaction } from '@/components/account/types';

export function AccountPointsPage() {
  const t = useTranslations('account');
  const { customer } = useAuth();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    void (async () => {
      try {
        const res = await fetch('/api/account/orders', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) {
          setTransactions((data.transactions ?? []) as PointTransaction[]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [customer]);

  if (!customer) {
    return <p className="text-sm text-ink-600">{t('loading')}</p>;
  }

  return (
    <div className="w-full min-w-0 space-y-8">
      <div>
        <h2 className="font-display text-xl font-bold text-ink-900">{t('pointsPageTitle')}</h2>
        <p className="mt-1 text-sm text-ink-600">{t('pointsPageSubtitle')}</p>
      </div>

      <PointsBalanceCard customer={customer} />

      <section>
        <h3 className="font-display text-lg font-bold text-ink-900">{t('historyTitle')}</h3>
        <div className="mt-3">
          {loading ? (
            <p className="text-sm text-ink-600">{t('loading')}</p>
          ) : (
            <PointsHistoryList transactions={transactions} />
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
