'use client';

import { useTranslations } from 'next-intl';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

export function SectionLoading() {
  const t = useTranslations('common');

  return (
    <div className="flex min-h-[12rem] items-center justify-center py-10">
      <LoadingIndicator label={t('loading')} />
    </div>
  );
}
