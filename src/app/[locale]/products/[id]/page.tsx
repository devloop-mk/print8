import { ProductDetail } from '@/components/products/ProductDetail';
import { products } from '@/lib/data/catalog';
import { isProductVisibleOnStorefront } from '@/lib/cms/product-visibility';
import { resolveProductId } from '@/lib/products/product-id-aliases';
import { buildProductMetadata } from '@/lib/seo/page-metadata';
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
  if (!(await isProductVisibleOnStorefront(canonicalId))) {
    notFound();
  }
  const metadata = await buildProductMetadata(locale as Locale, canonicalId);
  if (!metadata) notFound();
  return metadata;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const canonicalId = resolveProductId(id);

  if (!products.some((p) => p.id === canonicalId)) {
    notFound();
  }

  if (!(await isProductVisibleOnStorefront(canonicalId))) {
    notFound();
  }

  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip px-4 py-12 sm:px-6 lg:px-8">
      <ProductDetail productId={canonicalId} />
    </div>
  );
}
