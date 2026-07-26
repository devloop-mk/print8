'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function ForgotPasswordForm() {
  const t = useTranslations('account');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t('forgotPasswordFailed'));
        return;
      }
      setInfo(t('forgotPasswordSent'));
    } catch {
      setError(t('forgotPasswordFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">
        {t('forgotPasswordTitle')}
      </h1>
      <p className="mt-2 text-sm text-ink-600">{t('forgotPasswordSubtitle')}</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="email">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-ink-200 px-3 py-2 text-sm"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {info ? <p className="text-sm text-brand-800">{info}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('loading') : t('forgotPasswordSubmit')}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-600">
        <Link href="/account/login" className="font-semibold text-brand-700 hover:underline">
          {t('backToLogin')}
        </Link>
      </p>
    </Card>
  );
}
