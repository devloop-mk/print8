import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CouplesDesignsArchive } from '@/components/products/CouplesDesignsArchive';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { getCouplePackTemplates } from '@/lib/data/couple-pack';
import { resolveCouplePackDesignTemplatesMap } from '@/lib/products/couple-pack-resolved';
import { buildPageMetadata, buildOgImageUrl } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'products.couplesArchive' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  return buildPageMetadata({
    locale: locale as Locale,
    title: `${t('title')} | Print 8`,
    description: t('subtitle'),
    path: '/products/ready-designs/couples',
    image: buildOgImageUrl({
      locale: locale as Locale,
      title: t('title'),
      description: t('subtitle'),
      badge: tm('badges.products'),
    }),
  });
}

export default async function CouplesReadyDesignsPage() {
  const initialPacks = getCouplePackTemplates();
  const initialDesigns =
    await resolveCouplePackDesignTemplatesMap(initialPacks);

  return (
    <Suspense fallback={<SectionLoading />}>
      <CouplesDesignsArchive
        initialPacks={initialPacks}
        initialDesigns={initialDesigns}
      />
    </Suspense>
  );
}
