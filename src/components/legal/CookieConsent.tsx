'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentValue,
} from '@/lib/legal/cookie-consent';
import { Button } from '@/components/ui/Button';

export function CookieConsent() {
  const t = useTranslations('legal.consent');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getCookieConsent() === null);
  }, []);

  function respond(value: CookieConsentValue) {
    setCookieConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-200 bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-live="polite"
      aria-label={t('title')}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="font-semibold text-ink-900">{t('title')}</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">{t('description')}</p>
          <p className="mt-2 text-sm">
            <Link href="/cookies" className="font-medium text-brand-600 hover:text-brand-700">
              {t('learnMore')}
            </Link>
            {' · '}
            <Link href="/privacy" className="font-medium text-brand-600 hover:text-brand-700">
              {t('privacyLink')}
            </Link>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <Button type="button" variant="outline" onClick={() => respond('rejected')}>
            {t('reject')}
          </Button>
          <Button type="button" onClick={() => respond('accepted')}>
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  );
}
