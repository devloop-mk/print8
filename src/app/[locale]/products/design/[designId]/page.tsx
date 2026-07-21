import { Suspense } from 'react';
import { ProductDesignDetail } from '@/components/products/ProductDesignDetail';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { productTypes, type ProductType } from '@/lib/data/catalog';
import { buildDesignProductMetadata } from '@/lib/seo/page-metadata';
import { resolveProductDesignTemplate } from '@/lib/products/resolve-product-design-template';
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
  params: Promise<{ locale: string; designId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { locale, designId } = await params;
  const query = await searchParams;
  const preferredType = parsePreferredProductType(query.type);
  const design = await resolveProductDesignTemplate(designId);
  if (!design) notFound();
  const metadata = await buildDesignProductMetadata(
    locale as Locale,
    designId,
    design,
    preferredType,
  );
  if (!metadata) notFound();
  return metadata;
}

export default async function DesignProductPage({
  params,
}: {
  params: Promise<{ locale: string; designId: string }>;
}) {
  const { designId } = await params;
  const design = await resolveProductDesignTemplate(designId);

  if (!design) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<SectionLoading />}>
        <ProductDesignDetail designId={designId} initialDesign={design} />
      </Suspense>
    </div>
  );
}
