'use client';

import { useTranslations } from 'next-intl';
import type { PointTransaction } from '@/components/account/types';

export function PointsHistoryList({ transactions }: { transactions: PointTransaction[] }) {
  const t = useTranslations('account');

  if (transactions.length === 0) {
    return <p className="text-sm text-ink-600">{t('noHistory')}</p>;
  }

  return (
    <ul className="w-full min-w-0 divide-y divide-ink-200 border border-ink-200 bg-white">
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
              tx.points > 0 ? 'font-semibold text-brand-700' : 'font-semibold text-ink-900'
            }
          >
            {tx.points > 0 ? `+${tx.points}` : tx.points}
          </p>
        </li>
      ))}
    </ul>
  );
}
