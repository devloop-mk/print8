import { Suspense } from 'react';
import { ProductDesignDetail } from '@/components/products/ProductDesignDetail';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { buildDesignProductMetadata } from '@/lib/seo/page-metadata';
import { resolveProductDesignTemplate } from '@/lib/products/resolve-product-design-template';
import type { Locale } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; designId: string }>;
}): Promise<Metadata> {
  const { locale, designId } = await params;
  const design = await resolveProductDesignTemplate(designId);
  if (!design) notFound();
  const metadata = await buildDesignProductMetadata(
    locale as Locale,
    designId,
    design,
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
