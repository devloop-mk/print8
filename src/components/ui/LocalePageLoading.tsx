'use client';

import { useTranslations } from 'next-intl';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

export function LocalePageLoading() {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-20">
      <LoadingIndicator label={t('loading')} size="lg" />
    </div>
  );
}
