import { getTranslations } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import type { Metadata } from 'next';
import { DesignsCategoriesOverview } from '@/components/designs/DesignsCategoriesOverview';
import { Button } from '@/components/ui/Button';
import { PageIntro } from '@/components/brand/PageIntro';
import { buildSectionMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { getDesignCategoryCounts } from '@/lib/catalog/design-catalog';
import { designCategoryHref, isDesignCategory } from '@/lib/designs/design-nav';

export const revalidate = 86400;

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
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const categoryParam =
    typeof query.category === 'string' ? query.category : null;

  // Legacy `/designs?category=X` → category page (or /designs/all for other filters).
  if (categoryParam && isDesignCategory(categoryParam)) {
    redirect({
      href: designCategoryHref(categoryParam, {
        tag: typeof query.tag === 'string' ? query.tag : undefined,
        q: typeof query.q === 'string' ? query.q : undefined,
        page:
          typeof query.page === 'string' ? Number(query.page) || undefined : undefined,
      }),
      locale: locale as Locale,
    });
  }

  const legacyQuery = new URLSearchParams();
  for (const key of ['tag', 'q', 'page'] as const) {
    const value = query[key];
    if (typeof value === 'string' && value.length > 0) {
      legacyQuery.set(key, value);
    }
  }

  if (legacyQuery.toString()) {
    redirect({
      href: `/designs/all?${legacyQuery.toString()}`,
      locale: locale as Locale,
    });
  }

  const t = await getTranslations('designs');
  // Separate cache tag from catalog-designs — exclusive orders must not rewrite this ISR shell.
  const categoryCounts = await getDesignCategoryCounts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageIntro title={t('title')} subtitle={t('subtitle')}>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/designs/custom">
            <Button size="lg" variant="outline">
              {t('createOwn')}
            </Button>
          </Link>
          <Link href="/designs/all">
            <Button size="lg">{t('categoriesOverview.seeAll')}</Button>
          </Link>
        </div>
      </PageIntro>

      <DesignsCategoriesOverview categoryCounts={categoryCounts} />
    </div>
  );
}
