'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentValue,
} from '@/lib/legal/cookie-consent';
import { isCookieConsentRelatedPath } from '@/lib/legal/pages';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function CookieConsent() {
  const t = useTranslations('legal.consent');
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const onPolicyPage = isCookieConsentRelatedPath(pathname);

  useEffect(() => {
    setVisible(getCookieConsent() === null);
  }, []);

  useEffect(() => {
    if (!visible || !onPolicyPage) return;

    document.body.classList.add('cookie-consent-compact');
    return () => {
      document.body.classList.remove('cookie-consent-compact');
    };
  }, [visible, onPolicyPage]);

  function respond(value: CookieConsentValue) {
    setCookieConsent(value);
    setVisible(false);
  }

  if (!visible) return null;

  const panel = (
      <div
        className={cn(
          'border border-ink-200 bg-white shadow-xl',
          onPolicyPage
            ? 'w-full rounded-none border-x-0 border-b-0 p-4 sm:p-5'
            : 'w-full max-w-lg rounded-2xl p-5 sm:p-6',
        )}
        role="dialog"
        aria-modal={!onPolicyPage}
        aria-labelledby="cookie-consent-title"
      >
        <p id="cookie-consent-title" className="text-lg font-semibold text-ink-900">
          {t('title')}
        </p>
        {!onPolicyPage ? (
          <>
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
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-600">{t('policyPageHint')}</p>
        )}

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

        <div
          className={cn(
            'mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
            onPolicyPage && 'mt-4 sm:mt-3',
          )}
        >
          <Button type="button" variant="outline" onClick={() => respond('rejected')}>
            {t('reject')}
          </Button>
          <Button type="button" onClick={() => respond('accepted')}>
            {t('accept')}
          </Button>
        </div>
      </div>
  );

  if (onPolicyPage) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto max-w-7xl">{panel}</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/35 p-3 sm:items-center sm:p-6">
      {panel}
    </div>
  );
}
