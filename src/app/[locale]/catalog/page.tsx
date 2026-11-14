import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { PromoFlipbook } from '@/components/catalog/promo-flipbook/PromoFlipbook';
import { buildSectionMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  return buildSectionMetadata(
    locale as Locale,
    '/catalog',
    'promoCatalog',
    tm('badges.catalog'),
  );
}

export default function PromoCatalogPage() {
  return <PromoFlipbook />;
}
