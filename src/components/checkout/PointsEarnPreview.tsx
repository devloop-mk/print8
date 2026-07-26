'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useOptionalAuth } from '@/components/auth/AuthProvider';
import { quoteOrderPointsEarn } from '@/lib/loyalty/points';

type PointsEarnPreviewProps = {
  payableTotal: number;
};

export function PointsEarnPreview({ payableTotal }: PointsEarnPreviewProps) {
  const t = useTranslations('checkout');
  const auth = useOptionalAuth();
  const customer = auth?.customer;

  const quote = useMemo(() => {
    if (!customer || payableTotal <= 0) return null;
    return quoteOrderPointsEarn({
      cashPaidMkd: payableTotal,
      firstOrderBonusEligible: !customer.firstOrderBonusGranted,
    });
  }, [customer, payableTotal]);

  if (!customer) {
    if (payableTotal <= 0) return null;
    const guestQuote = quoteOrderPointsEarn({
      cashPaidMkd: payableTotal,
      firstOrderBonusEligible: true,
    });
    if (guestQuote.total <= 0) return null;
    return (
      <div className="mt-3 rounded-lg border border-dashed border-brand-200 bg-white/80 p-3 text-sm text-ink-700">
        <p>
          {t('pointsEarnGuest', { count: guestQuote.total })}
        </p>
        <Link
          href="/account/login"
          className="mt-1 inline-block font-semibold text-brand-700 hover:underline"
        >
          {t('pointsLoginLink')}
        </Link>
      </div>
    );
  }

  if (!quote || quote.total <= 0) return null;

  return (
    <div className="mt-3 rounded-lg border border-brand-200 bg-white/90 p-3 text-sm text-ink-800">
      <p className="font-semibold text-brand-900">
        {t('pointsEarnTitle', { count: quote.total })}
      </p>
      <p className="mt-1 text-ink-600">{t('pointsEarnPendingNote')}</p>
      {quote.bonus > 0 ? (
        <p className="mt-1 text-ink-600">
          {t('pointsEarnBonusIncluded', { count: quote.bonus })}
        </p>
      ) : null}
      <Link
        href="/loyalty-points"
        className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:underline"
      >
        {t('pointsLearnMore')}
      </Link>
    </div>
  );
}
