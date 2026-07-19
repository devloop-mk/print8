'use client';

import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GlobalSearchButton({
  className,
  onClick,
}: {
  className?: string;
  onClick: () => void;
}) {
  const t = useTranslations('search');

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 border-2 border-transparent p-2 text-ink-600 transition hover:border-ink-200 hover:bg-ink-50',
        className,
      )}
      aria-label={t('open')}
    >
      <Search className="h-5 w-5" aria-hidden="true" />
      <span className="hidden xl:inline text-sm font-medium">{t('open')}</span>
    </button>
  );
}
