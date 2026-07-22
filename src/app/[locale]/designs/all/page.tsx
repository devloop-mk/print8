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
import { toGalleryDesignTemplates } from '@/lib/catalog/slim-design-template';
import { getManagedSvgTemplateDefaultsMap, getManagedSvgTemplateVersionMap } from '@/lib/designs/managed-svg-template-defaults';
import { ArrowLeft } from 'lucide-react';

/** Full gallery payload — skip ISR writes; render on demand. */
export const dynamic = 'force-dynamic';

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
  const [published, svgDefaultsMap, svgThumbVersions] = await Promise.all([
    getPublishedDesignTemplates(),
    getManagedSvgTemplateDefaultsMap(),
    getManagedSvgTemplateVersionMap(),
  ]);
  const designs = toGalleryDesignTemplates(published);

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
        <DesignsGallery
          designs={designs}
          svgDefaultsMap={svgDefaultsMap}
          svgThumbVersions={svgThumbVersions}
        />
      </Suspense>
    </div>
  );
}
