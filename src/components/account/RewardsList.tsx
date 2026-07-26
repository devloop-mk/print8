'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SPIN_PENDING_COUPON_KEY } from '@/lib/rewards/spin-config';
import { isAccountRewardUsable, isCouponExpired } from '@/lib/coupons/coupon-lifecycle';
import type { AccountReward } from '@/components/account/types';

type RewardsListProps = {
  rewards: AccountReward[];
  customerEmail?: string;
  emptyAction?: ReactNode;
};

export function RewardsList({ rewards, customerEmail, emptyAction }: RewardsListProps) {
  const t = useTranslations('account');
  const locale = useLocale();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (rewards.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-600">{t('noRewards')}</p>
        {emptyAction}
      </div>
    );
  }

  async function copyRewardCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      /* ignore */
    }
  }

  function useRewardAtCheckout(code: string) {
    if (!customerEmail) return;
    try {
      sessionStorage.setItem(
        SPIN_PENDING_COUPON_KEY,
        JSON.stringify({
          code,
          email: customerEmail.toLowerCase(),
        }),
      );
    } catch {
      /* ignore */
    }
  }

  return (
    <ul className="w-full min-w-0 divide-y divide-ink-200 border border-ink-200 bg-white">
      {rewards.map((reward) => {
        const expiresLabel = reward.endsAt
          ? new Date(reward.endsAt).toLocaleDateString(locale)
          : null;
        const expired = !reward.redeemed && isCouponExpired(reward.endsAt);
        const usable = isAccountRewardUsable(reward);

        return (
          <li
            key={reward.code}
            className="flex flex-wrap items-start justify-between gap-3 px-4 py-4"
          >
            <div className="min-w-0">
              <p className="font-semibold text-ink-900">
                {t('rewardDiscount', { amount: reward.discountAmount })}
              </p>
              {reward.minOrderAmount != null ? (
                <p className="mt-1 text-sm text-ink-600">
                  {t('rewardMinOrder', { min: reward.minOrderAmount })}
                </p>
              ) : null}
              {expiresLabel ? (
                <p className="mt-1 text-sm text-ink-600">
                  {t('rewardExpires', { date: expiresLabel })}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-ink-500">
                {reward.redeemed
                  ? t('rewardRedeemed')
                  : expired
                    ? t('rewardExpired')
                    : t('rewardActive')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <code className="border border-dashed border-brand-300 bg-ink-50 px-3 py-2 text-sm font-bold tracking-wider text-ink-900">
                  {reward.code}
                </code>
                <button
                  type="button"
                  onClick={() => void copyRewardCode(reward.code)}
                  className="border border-ink-200 bg-white p-2 text-ink-700 hover:bg-ink-50"
                  aria-label={t('copyRewardCode')}
                >
                  {copiedCode === reward.code ? (
                    <Check className="h-4 w-4 text-brand-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              {usable ? (
                <Link href="/checkout" onClick={() => useRewardAtCheckout(reward.code)}>
                  <Button size="sm">{t('useRewardCta')}</Button>
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
