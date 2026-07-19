'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentValue,
} from '@/lib/legal/cookie-consent';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function CookieConsent() {
  const t = useTranslations('legal.consent');
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    setVisible(getCookieConsent() === null);
  }, []);

  function respond(value: CookieConsentValue) {
    setCookieConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/35 p-3 sm:items-center sm:p-6">
      <div
        className="w-full max-w-lg rounded-2xl border border-ink-200 bg-white p-5 shadow-xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
      >
        <p id="cookie-consent-title" className="text-lg font-semibold text-ink-900">
          {t('title')}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{t('description')}</p>
        <p className="mt-2 text-sm">
          <Link href="/cookies" className="font-medium text-brand-600 hover:text-brand-700">
            {t('learnMore')}
          </Link>
          {' · '}
          <Link href="/privacy" className="font-medium text-brand-600 hover:text-brand-700">
            {t('privacyLink')}
          </Link>
        </p>

        <button
          type="button"
          onClick={() => setShowDetails((open) => !open)}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ink-500 transition hover:text-ink-700"
          aria-expanded={showDetails}
        >
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform',
              showDetails ? 'rotate-180' : 'rotate-0',
            )}
            aria-hidden="true"
          />
          <span>{t('configure')}</span>
        </button>

        {showDetails ? (
          <div className="mt-3 rounded-xl border border-ink-100 bg-ink-50/70 p-3">
            <label className="flex items-start gap-3 text-sm text-ink-700">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-0.5 h-4 w-4 rounded border-ink-300"
              />
              <span>
                <span className="font-medium text-ink-900">{t('necessaryTitle')}</span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  {t('necessaryHelp')}
                </span>
              </span>
            </label>
            <label className="mt-3 flex items-start gap-3 text-sm text-ink-700">
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                <span className="font-medium text-ink-900">{t('analyticsTitle')}</span>
                <span className="mt-0.5 block text-xs text-ink-500">
                  {t('analyticsHelp')}
                </span>
              </span>
            </label>
            <div className="mt-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => respond(analyticsEnabled ? 'accepted' : 'rejected')}
              >
                {t('savePreferences')}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
