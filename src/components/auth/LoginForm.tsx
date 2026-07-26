'use client';

import { Suspense, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { EmailConfirmedNotice } from '@/components/auth/EmailConfirmedNotice';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function LoginForm({ redirectTo = '/account' }: { redirectTo?: string }) {
  const t = useTranslations('account');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const resolvedRedirect =
    redirectParam?.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : redirectTo;
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam?.trim()) {
      setEmail(emailParam.trim());
    }
  }, [searchParams]);

  useEffect(() => {
    const oauth = searchParams.get('oauth');
    const reason = searchParams.get('reason');
    if (oauth === 'failed') {
      if (reason === 'pkce') {
        setError(t('googleSignInPkceFailed'));
      } else if (reason === 'provider') {
        setError(t('googleSignInProviderFailed'));
      } else {
        setError(t('googleSignInFailed'));
      }
    } else if (oauth === 'missing_code') {
      setError(t('googleSignInRedirectFailed'));
    } else if (searchParams.get('email') === 'confirm_failed') {
      setError(t('emailConfirmFailed'));
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
        if (data.code === 'use_google') {
          setError(t('loginUseGoogle'));
          return;
        }
        setError(data.error ?? t('loginFailed'));
        return;
      }
      await refresh();
      router.push(resolvedRedirect);
      router.refresh();
    } catch {
      setError(t('loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <Suspense fallback={null}>
        <EmailConfirmedNotice />
      </Suspense>
      <h1 className="font-display text-2xl font-bold text-ink-900">{t('loginTitle')}</h1>
      <p className="mt-2 text-sm text-ink-600">{t('loginSubtitle')}</p>
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
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-ink-700" htmlFor="password">
              {t('password')}
            </label>
            <Link
              href="/account/forgot-password"
              className="text-xs font-medium text-brand-700 hover:underline"
            >
              {t('forgotPassword')}
            </Link>
          </div>
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
      <GoogleSignInButton redirectTo={resolvedRedirect} />
      <p className="mt-4 text-center text-sm text-ink-600">
        {t('noAccount')}{' '}
        <Link href="/account/register" className="font-semibold text-brand-700 hover:underline">
          {t('register')}
        </Link>
      </p>
    </Card>
  );
}
