'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function ResetPasswordForm() {
  const t = useTranslations('account');
  const router = useRouter();
  const { refresh } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'no_session') {
          setError(t('resetPasswordNoSession'));
        } else {
          setError(data.error ?? t('resetPasswordFailed'));
        }
        return;
      }
      await refresh();
      router.push('/account?password=reset');
      router.refresh();
    } catch {
      setError(t('resetPasswordFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="font-display text-2xl font-bold text-ink-900">
        {t('resetPasswordTitle')}
      </h1>
      <p className="mt-2 text-sm text-ink-600">{t('resetPasswordSubtitle')}</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink-700" htmlFor="password">
            {t('newPassword')}
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
        <div>
          <label
            className="mb-1 block text-sm font-medium text-ink-700"
            htmlFor="confirmPassword"
          >
            {t('confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-ink-200 px-3 py-2 text-sm"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('loading') : t('resetPasswordSubmit')}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-ink-600">
        <Link
          href="/account/forgot-password"
          className="font-semibold text-brand-700 hover:underline"
        >
          {t('forgotPasswordSubmit')}
        </Link>
        {' · '}
        <Link href="/account/login" className="font-semibold text-brand-700 hover:underline">
          {t('backToLogin')}
        </Link>
      </p>
    </Card>
  );
}
