import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ChristmasDesignsArchive } from '@/components/products/ChristmasDesignsArchive';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { getChristmasCatalogEntries } from '@/lib/products/christmas-designs';
import { getMergedProductDesignTemplates } from '@/lib/products/merged-product-designs';
import { slimProductDesignCatalogEntries } from '@/lib/products/slim-catalog-entry';
import { buildPageMetadata, buildOgImageUrl } from '@/lib/seo/metadata';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import type { Locale } from '@/i18n/routing';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: 'products.christmasArchive',
  });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  return buildPageMetadata({
    locale: locale as Locale,
    title: `${t('title')} | Print 8`,
    description: t('subtitle'),
    path: PRODUCT_OFFERING_PATHS.christmasReadyDesigns,
    image: buildOgImageUrl({
      locale: locale as Locale,
      title: t('title'),
      description: t('subtitle'),
      badge: tm('badges.products'),
    }),
  });
}

export default async function ChristmasReadyDesignsPage() {
  const merged = await getMergedProductDesignTemplates();
  const initialEntries = slimProductDesignCatalogEntries(
    getChristmasCatalogEntries(merged),
  );

  return (
    <Suspense fallback={<SectionLoading />}>
      <ChristmasDesignsArchive entries={initialEntries} />
    </Suspense>
  );
}
