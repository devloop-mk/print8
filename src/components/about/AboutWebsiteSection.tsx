import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card } from '@/components/ui/Card';

/** Site purpose + accounts (use as Google OAuth home page: /about). */
export async function AboutWebsiteSection() {
  const t = await getTranslations('about');

  return (
    <Card className="mt-10 border-brand-100 bg-brand-50/40 p-6 sm:p-8">
      <h2 className="font-display text-xl font-bold text-ink-900 sm:text-2xl">
        {t('websiteTitle')}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-ink-600 sm:text-base">
        {t('websiteBody')}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-600 sm:text-base">
        {t('accountsBody')}
      </p>
      <p className="mt-4 text-sm text-ink-600">
        <Link href="/privacy" className="font-medium text-brand-700 hover:underline">
          {t('privacyLink')}
        </Link>
        <span className="mx-2 text-ink-400" aria-hidden>·</span>
        <Link href="/terms" className="font-medium text-brand-700 hover:underline">
          {t('termsLink')}
        </Link>
      </p>
    </Card>
  );
}
