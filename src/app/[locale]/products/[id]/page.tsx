import { ProductDetail } from '@/components/products/ProductDetail';
import { products } from '@/lib/data/catalog';
import { notFound } from 'next/navigation';

export default async function ProductDetailPage({
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
      <ProductDetail productId={id} />
    </div>
  );
}
