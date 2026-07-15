import { CouplePackDetail } from '@/components/products/CouplePackDetail';
import { getCouplePackTemplate } from '@/lib/data/couple-pack';
import { buildCouplePackMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; packId: string }>;
}): Promise<Metadata> {
  const { locale, packId } = await params;
  const metadata = await buildCouplePackMetadata(locale as Locale, packId);
  if (!metadata) notFound();
  return metadata;
}

export default async function CouplePackPage({
  params,
}: {
  params: Promise<{ locale: string; packId: string }>;
}) {
  const { packId } = await params;

  if (!getCouplePackTemplate(packId)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <CouplePackDetail packId={packId} />
    </div>
  );
}
