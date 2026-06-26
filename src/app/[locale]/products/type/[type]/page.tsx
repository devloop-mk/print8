import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductTypeCatalog } from '@/components/products/ProductTypeCatalog';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { productTypes } from '@/lib/data/catalog';
import { buildProductTypePageMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import type { ProductType } from '@/lib/data/catalog';

function isProductType(value: string): value is ProductType {
  return (productTypes as readonly string[]).includes(value);
}

export function generateStaticParams() {
  return productTypes.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}): Promise<Metadata> {
  const { locale, type } = await params;
  if (!isProductType(type)) notFound();
  return buildProductTypePageMetadata(locale as Locale, type);
}

export default async function ProductTypePage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { type } = await params;

  if (!isProductType(type)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<SectionLoading />}>
        <ProductTypeCatalog type={type} />
      </Suspense>
    </div>
  );
}
