import { redirect } from 'next/navigation';
import { products } from '@/lib/data/catalog';

export default async function ProductPhotoDesignsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;

  if (!products.some((p) => p.id === id)) {
    redirect('/products');
  }

  redirect(`/products/${id}/designs`);
}
