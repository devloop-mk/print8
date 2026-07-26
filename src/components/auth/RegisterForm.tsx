'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function RegisterForm() {
  const t = useTranslations('account');
  const router = useRouter();
  const { refresh } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const apiError = typeof data.error === 'string' ? data.error : null;
        if (apiError?.toLowerCase().includes('rate limit')) {
          setError(t('signupRateLimited'));
        } else {
          setError(apiError ?? t('registerFailed'));
        }
        return;
      }
      if (data.needsEmailConfirmation) {
        setInfo(t('confirmEmail'));
        return;
      }
      await refresh();
      router.push('/account');
      router.refresh();
    } catch {
      setError(t('registerFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">{t('registerTitle')}</h1>
      <p className="mt-2 text-sm text-ink-600">{t('registerSubtitle')}</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="fullName">
            {t('fullName')}
          </label>
          <input
            id="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-ink-200 px-3 py-2 text-sm"
          />
        </div>
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
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="password">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-ink-200 px-3 py-2 text-sm"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {info ? <p className="text-sm text-brand-700">{info}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('loading') : t('register')}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-600">
        {t('hasAccount')}{' '}
        <Link href="/account/login" className="font-semibold text-brand-700 hover:underline">
          {t('login')}
        </Link>
      </p>
    </Card>
  );
}
