import { CouplePackDetail } from '@/components/products/CouplePackDetail';
import { productTypes, type ProductType } from '@/lib/data/catalog';
import { getCouplePackTemplate } from '@/lib/data/couple-pack';
import { resolveCouplePackPartnerDesigns } from '@/lib/products/couple-pack-resolved';
import { buildCouplePackMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

function parsePreferredProductType(
  value: string | string[] | undefined,
): ProductType | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  if (!(productTypes as readonly string[]).includes(raw)) return undefined;
  return raw as ProductType;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; packId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale, packId } = await params;
  const query = await searchParams;
  const preferredType = parsePreferredProductType(query.type);
  const metadata = await buildCouplePackMetadata(
    locale as Locale,
    packId,
    preferredType,
  );
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

  const partnerDesigns = await resolveCouplePackPartnerDesigns(packId);
  if (!partnerDesigns) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <CouplePackDetail
        packId={packId}
        initialDesign1={partnerDesigns.design1}
        initialDesign2={partnerDesigns.design2}
      />
    </div>
  );
}
