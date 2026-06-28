import { redirect } from 'next/navigation';
import {
  isProductNavCategoryId,
  productCategoryCustomHref,
} from '@/lib/products/product-nav';

export default async function ProductCategoryBrowsePage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { category } = await params;

  if (!isProductNavCategoryId(category)) {
    redirect('/products');
  }

  redirect(productCategoryCustomHref(category));
}
