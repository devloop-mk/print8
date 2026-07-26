'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function LoginForm({ redirectTo = '/account' }: { redirectTo?: string }) {
  const t = useTranslations('account');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const oauth = searchParams.get('oauth');
    if (oauth === 'failed' || oauth === 'missing_code') {
      setError(t('googleSignInFailed'));
    }
  }, [searchParams, t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t('loginFailed'));
        return;
      }
      await refresh();
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(t('loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">{t('loginTitle')}</h1>
      <p className="mt-2 text-sm text-ink-600">{t('loginSubtitle')}</p>
      <GoogleSignInButton redirectTo={redirectTo} />
      <form onSubmit={handleSubmit} className="mt-2 space-y-4">
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
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-ink-200 px-3 py-2 text-sm"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('loading') : t('login')}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-600">
        {t('noAccount')}{' '}
        <Link href="/account/register" className="font-semibold text-brand-700 hover:underline">
          {t('register')}
        </Link>
      </p>
    </Card>
  );
}
