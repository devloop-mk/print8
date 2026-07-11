import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BrandingPackWizard } from '@/components/products/branding-pack/BrandingPackWizard';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { buildPageMetadata, buildOgImageUrl } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  const t = await getTranslations({ locale, namespace: 'products.brandingPack' });

  return buildPageMetadata({
    locale: locale as Locale,
    title: `${t('title')} | Print 8`,
    description: t('subtitle'),
    path: '/products/branding-pack',
    image: buildOgImageUrl({
      locale: locale as Locale,
      title: t('title'),
      description: t('subtitle'),
      badge: tm('badges.products'),
    }),
  });
}

export default function BrandingPackPage() {
  return (
    <Suspense fallback={<SectionLoading />}>
      <BrandingPackWizard />
    </Suspense>
  );
}
