import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { products } from '@/lib/data/catalog';

export default async function ProductPhotoDesignsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  if (!products.some((p) => p.id === id)) {
    redirect({ href: '/products', locale: locale as Locale });
  }

  redirect({ href: `/products/${id}/designs`, locale: locale as Locale });
}
