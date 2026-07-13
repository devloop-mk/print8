import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DesignsGallery } from '@/components/designs/DesignsGallery';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { PageIntro } from '@/components/brand/PageIntro';
import { buildSectionMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { getPublishedDesignTemplates } from '@/lib/catalog/design-catalog';
import { getManagedSvgTemplateDefaultsMap } from '@/lib/designs/managed-svg-template-defaults';
import { ArrowLeft } from 'lucide-react';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  return buildSectionMetadata(
    locale as Locale,
    '/designs/all',
    'designs',
    tm('badges.designs'),
  );
}

export default async function DesignsAllPage() {
  const t = await getTranslations('designs');
  const [designs, svgDefaultsMap] = await Promise.all([
    getPublishedDesignTemplates(),
    getManagedSvgTemplateDefaultsMap(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/designs"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('categoriesOverview.backToCategories')}
      </Link>

      <PageIntro title={t('allPage.title')} subtitle={t('allPage.subtitle')} />

      <Suspense fallback={<SectionLoading />}>
        <DesignsGallery designs={designs} svgDefaultsMap={svgDefaultsMap} />
      </Suspense>
    </div>
  );
}
