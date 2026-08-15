'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getTurnstileSiteKey } from '@/lib/security/turnstile-public';

const SITE_KEY = getTurnstileSiteKey();

/** Client-side codes for invalid sitekey / unauthorized hostname (Cloudflare may surface 400020). */
function isTurnstileConfigError(code: string | number): boolean {
  const n = typeof code === 'number' ? code : Number(code);
  return n === 400020 || n === 110100 || n === 110110 || n === 110200 || n === 400070;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (errorCode: string | number) => void;
          theme?: 'light' | 'dark' | 'auto';
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

let scriptLoading = false;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (scriptLoading) {
      window.onTurnstileLoad = () => resolve();
      return;
    }
    scriptLoading = true;
    const script = document.createElement('script');
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => {
      scriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = false;
      reject(new Error('Turnstile script failed to load'));
    };
    document.head.appendChild(script);
  });
}

export function TurnstileWidget({
  onToken,
  className,
}: {
  onToken: (token: string) => void;
  className?: string;
}) {
  const t = useTranslations('common');
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;

    let cancelled = false;
    setLoadError(false);
    setConfigError(false);

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => onToken(token),
          'expired-callback': () => onToken(''),
          'error-callback': (errorCode) => {
            console.error('[TurnstileWidget] error', errorCode);
            onToken('');
            if (!cancelled && isTurnstileConfigError(errorCode)) {
              setConfigError(true);
            } else if (!cancelled) {
              setLoadError(true);
            }
          },
          theme: 'light',
        });
      })
      .catch((err) => {
        console.error('[TurnstileWidget]', err);
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onToken]);

  if (!SITE_KEY) return null;

  return (
    <div className={className}>
      {configError ? (
        <p className="text-sm text-red-600">{t('turnstileConfigError')}</p>
      ) : loadError ? (
        <p className="text-sm text-red-600">{t('turnstileLoadError')}</p>
      ) : null}
      <div ref={containerRef} />
    </div>
  );
}
