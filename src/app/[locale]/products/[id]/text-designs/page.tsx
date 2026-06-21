import { ProductDesignsPage } from '@/components/products/ProductDesignsPage';
import { products } from '@/lib/data/catalog';
import { buildProductDesignsMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const metadata = await buildProductDesignsMetadata(
    locale as Locale,
    id,
    'text-designs',
  );
  if (!metadata) notFound();
  return metadata;
}

export default async function ProductTextDesignsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  if (!products.some((p) => p.id === id)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ProductDesignsPage productId={id} category="text-designs" />
    </div>
  );
}
