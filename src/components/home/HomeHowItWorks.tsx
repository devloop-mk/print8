import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

/** Compact homepage teaser — full walkthrough lives on /how-to-order. */
export async function HomeHowItWorks() {
  const t = await getTranslations('home.howItWorks');

  return (
    <section className="border-b border-ink-200/80 bg-gradient-to-r from-brand-50/90 via-white to-white py-7 sm:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 lg:px-8">
        <div className="min-w-0 max-w-2xl">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 className="mt-2 font-display text-lg font-bold text-ink-900 sm:text-xl">
            {t('teaserTitle')}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-600">{t('teaserSubtitle')}</p>
        </div>
        <Link
          href="/how-to-order"
          className="inline-flex shrink-0 items-center justify-center gap-2 border-2 border-brand-600 bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lift-brand transition hover:-translate-y-0.5 hover:bg-brand-700"
        >
          {t('teaserCta')}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
