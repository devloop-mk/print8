import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProductDesignsCatalog } from '@/components/products/ProductDesignsCatalog';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { buildPageMetadata, buildOgImageUrl } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  const tc = await getTranslations({ locale, namespace: 'products.catalog' });

  return buildPageMetadata({
    locale: locale as Locale,
    title: `${tc('readyDesignsTitle')} | Print 8`,
    description: tc('readyDesignsSubtitle'),
    path: '/products/ready-designs',
    image: buildOgImageUrl({
      locale: locale as Locale,
      title: tc('readyDesignsTitle'),
      description: tc('readyDesignsSubtitle'),
      badge: tm('badges.products'),
    }),
  });
}

export default async function ProductReadyDesignsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<SectionLoading />}>
        <ProductDesignsCatalog category="image-designs" />
      </Suspense>
    </div>
  );
}
