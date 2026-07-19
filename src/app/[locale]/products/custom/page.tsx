import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProductCustomCatalog } from '@/components/products/ProductCustomCatalog';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { getProductDisplayOrderRecord } from '@/lib/cms/display-order';
import { buildPageMetadata, buildOgImageUrl } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';

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
    title: `${tc('customTitle')} | Print 8`,
    description: tc('customSubtitle'),
    path: '/products/custom',
    image: buildOgImageUrl({
      locale: locale as Locale,
      title: tc('customTitle'),
      description: tc('customSubtitle'),
      badge: tm('badges.products'),
    }),
  });
}

export default async function ProductCustomPage() {
  const displayOrder = await getProductDisplayOrderRecord();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<SectionLoading />}>
        <ProductCustomCatalog displayOrder={displayOrder} />
      </Suspense>
    </div>
  );
}
