'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';

export function NewsletterSubscribeForm({
  variant = 'light',
}: {
  variant?: 'light' | 'dark';
}) {
  const t = useTranslations('newsletter');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDark = variant === 'dark';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });

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

      setDone(true);
      setEmail('');
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p
        className={
          isDark ? 'text-sm text-emerald-300' : 'text-sm text-emerald-700'
        }
      >
        {t('success')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className={isDark ? 'text-sm text-ink-300' : 'text-sm text-ink-600'}>
        {t('subtitle')}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className={
            isDark
              ? 'w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white placeholder:text-ink-500'
              : 'w-full rounded-lg border border-ink-300 px-3 py-2 text-sm'
          }
        />
        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="shrink-0"
        >
          {t('subscribe')}
        </Button>
      </div>
      {error ? (
        <p className={isDark ? 'text-sm text-rose-300' : 'text-sm text-rose-700'}>
          {error}
        </p>
      ) : null}
    </form>
  );
}
