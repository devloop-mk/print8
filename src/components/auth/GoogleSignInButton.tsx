'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  buildLocalizedAccountPath,
  buildOAuthCallbackUrl,
} from '@/lib/auth/oauth';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-auth';
import { Button } from '@/components/ui/Button';
import type { Locale } from '@/i18n/routing';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.86z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type GoogleSignInButtonProps = {
  redirectTo?: string;
};

/** Must match the page origin — PKCE verifier cookie is scoped to this host. */
function getOAuthOrigin(): string {
  return window.location.origin.replace(/\/$/, '');
}

export function GoogleSignInButton({ redirectTo = '/account' }: GoogleSignInButtonProps) {
  const t = useTranslations('account');
  const locale = useLocale() as Locale;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const nextPath = buildLocalizedAccountPath(locale, redirectTo);
      const callbackUrl = buildOAuthCallbackUrl(getOAuthOrigin(), nextPath);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'online',
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        setError(t('googleSignInFailed'));
        setLoading(false);
      }
    } catch {
      setError(t('googleSignInFailed'));
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-ink-200" />
        </div>
        <div className="relative flex justify-center text-xs font-semibold uppercase tracking-wide">
          <span className="bg-white px-2 text-ink-500">{t('orContinueWith')}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 normal-case tracking-normal"
        onClick={() => void handleGoogleSignIn()}
        loading={loading}
        disabled={loading}
      >
        <GoogleIcon className="h-5 w-5 shrink-0" />
        {t('googleSignIn')}
      </Button>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
