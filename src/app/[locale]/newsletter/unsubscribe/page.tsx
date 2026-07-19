import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { NewsletterUnsubscribeClient } from '@/components/newsletter/NewsletterUnsubscribeClient';
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
    '/newsletter/unsubscribe',
    'newsletter',
    tm('badges.newsletter'),
  );
}

export default function NewsletterUnsubscribePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <NewsletterUnsubscribeClient />
      </Suspense>
    </div>
  );
}
