import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { PageIntro } from '@/components/brand/PageIntro';
import { OrderStatusLookupForm } from '@/components/order/OrderStatusLookupForm';
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
    '/order-status',
    'orderStatus',
    tm('badges.orderStatus'),
  );
}

export default async function OrderStatusPage() {
  const t = await getTranslations('orderStatus');

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <PageIntro
        title={t('title')}
        subtitle={t('subtitle')}
        centered
        className="mb-8"
      />
      <OrderStatusLookupForm />
    </div>
  );
}
