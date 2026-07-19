import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { PageIntro } from '@/components/brand/PageIntro';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { buildSectionMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';

const stepKeys = ['choose', 'personalize', 'checkout', 'receive'] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  return buildSectionMetadata(
    locale as Locale,
    '/how-to-order',
    'howToOrder',
    tm('badges.howToOrder'),
  );
}

export default async function HowToOrderPage() {
  const t = await getTranslations('howToOrder');

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <PageIntro
        title={t('title')}
        subtitle={t('subtitle')}
        centered
        className="mb-8"
      />

      <div className="space-y-4">
        {stepKeys.map((key, index) => (
          <Card key={key}>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
              {t('stepLabel', { number: index + 1 })}
            </p>
            <h2 className="mt-1 font-semibold text-ink-900">
              {t(`steps.${key}.title`)}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {t(`steps.${key}.body`)}
            </p>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h2 className="font-semibold text-ink-900">{t('tipsTitle')}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-600">
          <li>{t('tips.cod')}</li>
          <li>{t('tips.pickup')}</li>
          <li>{t('tips.files')}</li>
          <li>{t('tips.help')}</li>
        </ul>
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/products">
          <Button>{t('ctaProducts')}</Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline">{t('ctaContact')}</Button>
        </Link>
      </div>
    </div>
  );
}
