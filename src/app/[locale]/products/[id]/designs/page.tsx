import { ProductDesignsPage } from '@/components/products/ProductDesignsPage';
import { products } from '@/lib/data/catalog';
import { resolveProductId } from '@/lib/products/product-id-aliases';
import { buildProductPremadeDesignsMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const canonicalId = resolveProductId(id);
  const metadata = await buildProductPremadeDesignsMetadata(
    locale as Locale,
    canonicalId,
  );
  if (!metadata) notFound();
  return metadata;
}

export default async function ProductPremadeDesignsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const canonicalId = resolveProductId(id);

  if (!products.some((p) => p.id === canonicalId)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ProductDesignsPage productId={canonicalId} category="all" />
    </div>
  );
}
