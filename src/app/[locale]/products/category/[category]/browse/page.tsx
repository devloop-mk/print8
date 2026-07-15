import { redirect } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import {
  isProductNavCategoryId,
  productCategoryCustomHref,
} from '@/lib/products/product-nav';

export default async function ProductCategoryBrowsePage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { locale, category } = await params;

  if (!isProductNavCategoryId(category)) {
    notFound();
  }

  redirect({
    href: productCategoryCustomHref(category),
    locale: locale as Locale,
  });
}
