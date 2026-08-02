import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StudentPrintWizard } from '@/components/students/StudentPrintWizard';
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
  const t = await getTranslations({ locale, namespace: 'students.print' });

  return buildPageMetadata({
    locale: locale as Locale,
    title: `${t('title')} | Print 8`,
    description: t('subtitle'),
    path: '/students/print',
    image: buildOgImageUrl({
      locale: locale as Locale,
      title: t('title'),
      description: t('subtitle'),
      badge: tm('badges.services'),
    }),
  });
}

export default function StudentPrintPage() {
  return (
    <Suspense fallback={<SectionLoading />}>
      <StudentPrintWizard />
    </Suspense>
  );
}
