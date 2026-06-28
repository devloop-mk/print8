import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCategoryCatalog } from '@/components/products/ProductCategoryCatalog';
import { ProductCategoryPremadeCatalog } from '@/components/products/ProductCategoryPremadeCatalog';
import { SectionLoading } from '@/components/ui/SectionLoading';
import {
  categoryHasPremadeDesigns,
  getCategoryOffering,
} from '@/lib/products/offering';
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

export default async function ProductCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>;
}) {
  const { category } = await params;

  if (!isProductNavCategoryId(category)) {
    notFound();
  }

  const offering = getCategoryOffering(category);
  const showPremadeCatalog = categoryHasPremadeDesigns(offering);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<SectionLoading />}>
        {showPremadeCatalog ? (
          <ProductCategoryPremadeCatalog categoryId={category} />
        ) : (
          <ProductCategoryCatalog categoryId={category} variant="landing" />
        )}
      </Suspense>
    </div>
  );
}
