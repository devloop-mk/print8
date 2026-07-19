'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function NewsletterUnsubscribeClient() {
  const t = useTranslations('newsletter');
  const searchParams = useSearchParams();
  const token = searchParams.get('token')?.trim() ?? '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    token ? 'idle' : 'error',
  );

  async function unsubscribe() {
    if (!token || status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        setStatus('error');
        return;
      }
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    if (token) {
      void unsubscribe();
    }
    // Auto-unsubscribe once when token is present.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <Card className="mx-auto max-w-lg p-6 text-center">
      {status === 'loading' || status === 'idle' ? (
        <p className="text-sm text-ink-600">{t('unsubscribeLoading')}</p>
      ) : null}
      {status === 'done' ? (
        <>
          <h1 className="text-xl font-semibold text-ink-900">
            {t('unsubscribeTitle')}
          </h1>
          <p className="mt-2 text-sm text-ink-600">{t('unsubscribeSuccess')}</p>
        </>
      ) : null}
      {status === 'error' ? (
        <>
          <h1 className="text-xl font-semibold text-ink-900">
            {t('unsubscribeTitle')}
          </h1>
          <p className="mt-2 text-sm text-rose-700">{t('unsubscribeError')}</p>
          {token ? (
            <Button className="mt-4" onClick={() => void unsubscribe()}>
              {t('unsubscribeRetry')}
            </Button>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
