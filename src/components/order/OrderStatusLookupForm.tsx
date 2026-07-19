'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';

type OrderStatusResult = {
  orderNumber: string;
  status: string;
  fulfillmentMethod: 'cargo' | 'pickup';
  customerName: string;
  customerCity: string;
  totalAmount: number;
  locale: string;
  createdAt: string;
  itemCount: number;
};

export function OrderStatusLookupForm() {
  const t = useTranslations('orderStatus');
  const locale = useLocale();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrderStatusResult | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/orders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      });

      if (res.status === 404) {
        setError(t('notFound'));
        setLoading(false);
        return;
      }

      if (res.status === 429) {
        setError(t('rateLimited'));
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(t('error'));
        setLoading(false);
        return;
      }

      const data = (await res.json()) as OrderStatusResult;
      setResult(data);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              {t('orderNumber')}
            </label>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              minLength={4}
              placeholder={t('orderNumberPlaceholder')}
              className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">
              {t('phone')}
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              minLength={8}
              type="tel"
              placeholder={t('phonePlaceholder')}
              className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-ink-500">{t('phoneHint')}</p>
          </div>
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
          <Button type="submit" loading={loading} disabled={loading}>
            {t('submit')}
          </Button>
        </form>
      </Card>

      {result ? (
        <Card>
          <h2 className="text-lg font-semibold text-ink-900">{t('resultTitle')}</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-500">{t('orderNumber')}</dt>
              <dd className="font-semibold text-ink-900">{result.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-ink-500">{t('status')}</dt>
              <dd className="font-semibold text-brand-700">
                {t(`statuses.${result.status}`)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">{t('fulfillment')}</dt>
              <dd className="font-medium text-ink-900">
                {result.fulfillmentMethod === 'pickup'
                  ? t('fulfillmentPickup')
                  : t('fulfillmentCargo')}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">{t('total')}</dt>
              <dd className="font-medium text-ink-900">
                {formatPrice(result.totalAmount, locale)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">{t('city')}</dt>
              <dd className="font-medium text-ink-900">{result.customerCity}</dd>
            </div>
            <div>
              <dt className="text-ink-500">{t('items')}</dt>
              <dd className="font-medium text-ink-900">{result.itemCount}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-600">{t('resultHint')}</p>
        </Card>
      ) : null}
    </div>
  );
}
