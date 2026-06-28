import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCategoryCatalog } from '@/components/products/ProductCategoryCatalog';
import { SectionLoading } from '@/components/ui/SectionLoading';
import {
  isProductNavCategoryId,
  productNavCategoryIds,
} from '@/lib/products/product-nav';
import { buildProductCategoryMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';

export function generateStaticParams() {
  return productNavCategoryIds.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isProductNavCategoryId(category)) notFound();
  return buildProductCategoryMetadata(locale as Locale, category);
}

export default async function ProductCategoryBrowsePage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { category } = await params;

  if (!isProductNavCategoryId(category)) {
    notFound();
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<SectionLoading />}>
        <ProductCategoryCatalog categoryId={category} />
      </Suspense>
    </div>
  );
}
