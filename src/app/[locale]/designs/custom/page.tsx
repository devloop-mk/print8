import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CustomDesignOrderForm } from '@/components/designs/CustomDesignOrderForm';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { buildSectionMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  return buildSectionMetadata(
    locale as Locale,
    '/designs/custom',
    'designs.customOrder',
    tm('badges.design'),
  );
}

export default async function CustomDesignPage() {
  const t = await getTranslations('designs.customOrder');

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-3xl">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-600">{t('subtitle')}</p>
      </div>
      <Suspense fallback={<SectionLoading />}>
        <CustomDesignOrderForm />
      </Suspense>
    </div>
  );
}
