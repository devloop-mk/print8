'use client';

import { useTranslations } from 'next-intl';
import { Reveal } from '@/components/motion/Reveal';

export function ProductJourneyGuide() {
  const t = useTranslations('products.journey');

  function scrollToProducts() {
    document.getElementById('products-grid')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  return (
    <Reveal className="mb-5">
      <div className="flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-900">{t('focusedTitle')}</p>
          <p className="mt-0.5 text-sm text-ink-600">{t('focusedDesc')}</p>
        </div>
        <button
          type="button"
          onClick={scrollToProducts}
          className="shrink-0 self-start rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 sm:self-center"
        >
          {t('focusedCta')}
        </button>
      </div>
    </Reveal>
  );
}
