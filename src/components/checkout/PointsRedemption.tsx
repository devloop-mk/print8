'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useOptionalAuth } from '@/components/auth/AuthProvider';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

type PointsRedemptionProps = {
  subtotal: number;
  couponDiscount: number;
  onChange: (value: {
    pointsToRedeem: number;
    pointsDiscount: number;
    payableTotal: number;
  }) => void;
};

export function PointsRedemption({
  subtotal,
  couponDiscount,
  onChange,
}: PointsRedemptionProps) {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const auth = useOptionalAuth();
  const customer = auth?.customer;
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!customer || !usePoints || pointsToRedeem <= 0) {
      const payable = Math.max(0, subtotal - couponDiscount);
      onChange({ pointsToRedeem: 0, pointsDiscount: 0, payableTotal: payable });
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/loyalty/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subtotalAmount: subtotal,
              couponDiscount,
              pointsToRedeem,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            setMessage(t('pointsInvalid'));
            onChange({
              pointsToRedeem: 0,
              pointsDiscount: 0,
              payableTotal: Math.max(0, subtotal - couponDiscount),
            });
            return;
          }
          setMessage(
            t('pointsApplied', {
              points: data.pointsCharged,
              amount: formatPrice(data.pointsDiscount, locale),
            }),
          );
          onChange({
            pointsToRedeem: data.pointsCharged,
            pointsDiscount: data.pointsDiscount,
            payableTotal: data.payableTotal,
          });
        } catch {
          setMessage(t('pointsInvalid'));
        }
      })();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [couponDiscount, customer, locale, onChange, pointsToRedeem, subtotal, t, usePoints]);

  if (!customer) {
    return (
      <div className="rounded-lg border border-ink-200 bg-ink-50 p-4 text-sm text-ink-700">
        <p>{t('pointsLoginHint')}</p>
        <Link href="/account/login" className="mt-2 inline-block font-semibold text-brand-700 hover:underline">
          {t('pointsLoginLink')}
        </Link>
      </div>
    );
  }

  const maxPoints = customer.pointsBalance;

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink-900">{t('pointsTitle')}</p>
          <p className="text-sm text-ink-600">
            {t('pointsAvailable', { count: maxPoints })}
          </p>
          {customer.pointsPendingBalance > 0 ? (
            <p className="text-sm text-amber-700">
              {t('pointsPendingCheckout', { count: customer.pointsPendingBalance })}
            </p>
          ) : null}
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-ink-800">
          <input
            type="checkbox"
            checked={usePoints}
            onChange={(e) => {
              setUsePoints(e.target.checked);
              if (e.target.checked) {
                setPointsToRedeem(maxPoints);
              } else {
                setPointsToRedeem(0);
                setMessage(null);
              }
            }}
          />
          {t('pointsUse')}
        </label>
      </div>

      {usePoints ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={0}
            max={maxPoints}
            value={pointsToRedeem}
            onChange={(e) =>
              setPointsToRedeem(
                Math.max(0, Math.min(maxPoints, Number(e.target.value) || 0)),
              )
            }
            className="w-28 border border-ink-200 px-2 py-1.5 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPointsToRedeem(maxPoints)}
          >
            {t('pointsUseMax')}
          </Button>
        </div>
      ) : null}

      {message ? <p className="mt-2 text-sm text-brand-800">{message}</p> : null}
    </div>
  );
}
