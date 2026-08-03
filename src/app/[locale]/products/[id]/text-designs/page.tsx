import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { products } from '@/lib/data/catalog';
import { resolveProductId } from '@/lib/products/product-id-aliases';

export default async function ProductTextDesignsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const canonicalId = resolveProductId(id);

  if (!products.some((p) => p.id === canonicalId)) {
    redirect({ href: '/products', locale: locale as Locale });
  }

  redirect({
    href: `/products/${canonicalId}/designs`,
    locale: locale as Locale,
  });
}
