import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductTypeCatalog } from '@/components/products/ProductTypeCatalog';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { getProductTypeCatalogData } from '@/lib/cache/catalog-cache';
import { slimProductDesignCatalogEntries } from '@/lib/products/slim-catalog-entry';
import { productTypes } from '@/lib/data/catalog';
import { buildProductTypePageMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import type { ProductType } from '@/lib/data/catalog';

export const revalidate = 21600;

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

  const { products, readyDesignEntries, categoryPreviews } =
    await getProductTypeCatalogData(type);
  const slimReadyDesignEntries =
    slimProductDesignCatalogEntries(readyDesignEntries);

  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<SectionLoading />}>
        <ProductTypeCatalog
          type={type}
          products={products}
          readyDesignEntries={slimReadyDesignEntries}
          categoryPreviews={categoryPreviews}
        />
      </Suspense>
    </div>
  );
}
