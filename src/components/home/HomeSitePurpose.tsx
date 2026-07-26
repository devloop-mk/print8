import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/** Visible site identity for users and OAuth provider verification (Google). */
export async function HomeSitePurpose() {
  const t = await getTranslations('home.sitePurpose');

  return (
    <section
      aria-labelledby="print8-site-heading"
      className="border-b border-ink-200 bg-white py-6 sm:py-8"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h1
          id="print8-site-heading"
          className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl"
        >
          Print 8
        </h1>
        <p className="mt-2 text-base font-medium text-ink-700">{t('subtitle')}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{t('about')}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{t('accounts')}</p>
        <p className="mt-4 text-xs text-ink-500">
          <Link href="/privacy" className="font-medium text-brand-700 hover:underline">
            {t('privacy')}
          </Link>
          <span className="mx-2" aria-hidden>·</span>
          <Link href="/terms" className="font-medium text-brand-700 hover:underline">
            {t('terms')}
          </Link>
        </p>
      </div>
    </section>
  );
}
