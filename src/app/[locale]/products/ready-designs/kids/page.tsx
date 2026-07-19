import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { KidsDesignsArchive } from '@/components/products/KidsDesignsArchive';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { getCachedProductDesignCatalogEntries } from '@/lib/cache/catalog-cache';
import { filterKidsDesignCatalogEntries } from '@/lib/products/kids-designs';
import { buildPageMetadata, buildOgImageUrl } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products.kidsArchive' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  return buildPageMetadata({
    locale: locale as Locale,
    title: `${t('title')} | Print 8`,
    description: t('subtitle'),
    path: '/products/ready-designs/kids',
    image: buildOgImageUrl({
      locale: locale as Locale,
      title: t('title'),
      description: t('subtitle'),
      badge: tm('badges.products'),
    }),
  });
}

export default async function KidsReadyDesignsPage() {
  const allEntries =
    await getCachedProductDesignCatalogEntries('image-designs');
  const initialEntries = filterKidsDesignCatalogEntries(allEntries);

  return (
    <Suspense fallback={<SectionLoading />}>
      <KidsDesignsArchive initialEntries={initialEntries} />
    </Suspense>
  );
}
