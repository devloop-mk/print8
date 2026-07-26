'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useOptionalAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';

export function CheckoutAccountPrompt() {
  const t = useTranslations('checkout');
  const auth = useOptionalAuth();

  if (auth?.loading || auth?.customer) return null;

  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm">
      <p className="font-display text-lg font-bold text-ink-900">
        {t('accountPromptTitle')}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">
        {t('accountPromptBody')}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-ink-700">
        <li>• {t('accountPromptBenefitPoints')}</li>
        <li>• {t('accountPromptBenefitTrack')}</li>
        <li>• {t('accountPromptBenefitFaster')}</li>
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/account/register">
          <Button size="sm">{t('accountPromptRegister')}</Button>
        </Link>
        <Link href="/account/login">
          <Button size="sm" variant="outline">{t('accountPromptLogin')}</Button>
        </Link>
      </div>
    </div>
  );
}
