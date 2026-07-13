import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { DesignsCategoriesOverview } from '@/components/designs/DesignsCategoriesOverview';
import { Button } from '@/components/ui/Button';
import { PageIntro } from '@/components/brand/PageIntro';
import { buildSectionMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { getPublishedDesignTemplates } from '@/lib/catalog/design-catalog';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  return buildSectionMetadata(locale as Locale, '/designs', 'designs', tm('badges.designs'));
}

export default async function DesignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const legacyQuery = new URLSearchParams();

  for (const key of ['category', 'tag', 'q', 'page'] as const) {
    const value = params[key];
    if (typeof value === 'string' && value.length > 0) {
      legacyQuery.set(key, value);
    }
  }

  if (legacyQuery.toString()) {
    redirect(`/designs/all?${legacyQuery.toString()}`);
  }

  const t = await getTranslations('designs');
  const designs = await getPublishedDesignTemplates();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageIntro title={t('title')} subtitle={t('subtitle')}>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/designs/create">
            <Button size="lg" variant="outline">
              {t('createOwn')}
            </Button>
          </Link>
          <Link href="/designs/all">
            <Button size="lg">{t('categoriesOverview.seeAll')}</Button>
          </Link>
        </div>
      </PageIntro>

      <DesignsCategoriesOverview designs={designs} />
    </div>
  );
}
