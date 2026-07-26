'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function AccountDetailsPage() {
  const t = useTranslations('account');
  const { customer, refresh } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultCity, setDefaultCity] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    setFullName(customer.fullName ?? '');
    setPhone(customer.phone ?? '');
    setDefaultCity(customer.defaultCity ?? '');
    setDefaultAddress(customer.defaultAddress ?? '');
  }, [customer]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!customer) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          defaultCity: defaultCity.trim(),
          defaultAddress: defaultAddress.trim(),
        }),
      });

      if (!res.ok) {
        setError(t('profileSaveFailed'));
        return;
      }

      await refresh();
      setMessage(t('profileSaved'));
    } catch {
      setError(t('profileSaveFailed'));
    } finally {
      setSaving(false);
    }
  }

  if (!customer) return null;

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-ink-900">{t('detailsTitle')}</h2>
        <p className="mt-1 text-sm text-ink-600">{t('detailsSubtitle')}</p>
      </div>

      <Card className="p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-ink-500">{t('email')}</dt>
            <dd className="mt-0.5 font-medium text-ink-900">{customer.email}</dd>
          </div>
        </dl>
      </Card>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <Card className="space-y-4 p-6">
          <label className="block text-sm font-medium text-ink-700">
            {t('fullName')}
            <input
              type="text"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full border border-ink-300 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-500"
              autoComplete="name"
            />
          </label>

          <label className="block text-sm font-medium text-ink-700">
            {t('phone')}
            <input
              type="tel"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full border border-ink-300 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-500"
              autoComplete="tel"
            />
          </label>

          <label className="block text-sm font-medium text-ink-700">
            {t('defaultCity')}
            <input
              type="text"
              name="defaultCity"
              value={defaultCity}
              onChange={(e) => setDefaultCity(e.target.value)}
              className="mt-1.5 w-full border border-ink-300 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-500"
              autoComplete="address-level2"
            />
          </label>

          <label className="block text-sm font-medium text-ink-700">
            {t('defaultAddress')}
            <textarea
              name="defaultAddress"
              rows={3}
              value={defaultAddress}
              onChange={(e) => setDefaultAddress(e.target.value)}
              className="mt-1.5 w-full border border-ink-300 bg-white px-3 py-2.5 text-ink-900 outline-none focus:border-brand-500"
              autoComplete="street-address"
            />
          </label>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving} disabled={saving}>
            {t('saveProfile')}
          </Button>
          {message ? (
            <p className="text-sm font-medium text-brand-700" role="status">{message}</p>
          ) : null}
          {error ? (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
