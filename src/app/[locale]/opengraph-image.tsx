import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';
import { OgImageLayout } from '@/lib/seo/og-template';

export const alt = 'Print 8';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return new ImageResponse(
    (
      <OgImageLayout
        locale={locale}
        title={t('ogImageTitle')}
        description={t('ogImageDescription')}
        subtitle={t('ogImageSubtitle')}
        badge={t('ogImageBadge')}
      />
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
