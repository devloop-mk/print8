'use client';

import { Suspense, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/auth/AuthProvider';
import { EmailConfirmedNotice } from '@/components/auth/EmailConfirmedNotice';
import { PasswordResetNotice } from '@/components/auth/PasswordResetNotice';
import { Button } from '@/components/ui/Button';
import { AccountNav } from '@/components/account/AccountNav';

export function AccountShell({ children }: { children: ReactNode }) {
  const t = useTranslations('account');
  const { customer, logout } = useAuth();

  if (!customer) return null;

  return (
    <div className="mx-auto box-border w-6xl min-w-6xl max-w-6xl shrink-0 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <EmailConfirmedNotice />
        <PasswordResetNotice />
      </Suspense>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">{t('title')}</h1>
          <p className="mt-1 text-ink-600">{customer.email}</p>
        </div>
        <Button variant="outline" onClick={() => void logout()}>
          {t('logout')}
        </Button>
      </div>

      <div className="mt-8 w-full min-w-0 lg:grid lg:grid-cols-[11.5rem_minmax(0,1fr)] lg:gap-8">
        <AccountNav />
        <main className="mt-6 w-full min-w-0 lg:mt-0">{children}</main>
      </div>
    </div>
  );
}
