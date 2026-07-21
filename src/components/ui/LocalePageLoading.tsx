'use client';

import { useTranslations } from 'next-intl';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

export function LocalePageLoading() {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] flex-1 items-center justify-center px-4 py-20">
      <LoadingIndicator label={t('loading')} size="lg" />
    </div>
  );
}
