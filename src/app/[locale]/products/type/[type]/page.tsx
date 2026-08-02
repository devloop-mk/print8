import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { redirect } from '@/i18n/navigation';
import { ProductTypeCatalog } from '@/components/products/ProductTypeCatalog';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { getProductTypeCatalogData } from '@/lib/cache/catalog-cache';
import { getSuggestedProductsForType } from '@/lib/products/product-nav-catalog';
import { getVisibleProductTypes } from '@/lib/cms/product-visibility';
import { slimProductDesignCatalogEntries } from '@/lib/products/slim-catalog-entry';
import { productTypes } from '@/lib/data/catalog';
import { buildProductTypePageMetadata } from '@/lib/seo/page-metadata';
import {
  DRINKWARE_GLASS_NAV_TYPE,
  normalizeProductTypeRoute,
} from '@/lib/products/drinkware-type-groups';
import type { Locale } from '@/i18n/routing';
import type { ProductType } from '@/lib/data/catalog';

/** Fat catalog payload — skip ISR writes; render on demand. */
export const dynamic = 'force-dynamic';

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
  const catalogType = normalizeProductTypeRoute(type);
  return buildProductTypePageMetadata(locale as Locale, catalogType);
}

export default async function ProductTypePage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { locale, type } = await params;

  if (!isProductType(type)) {
    notFound();
  }

  const catalogType = normalizeProductTypeRoute(type);
  if (catalogType !== type) {
    redirect({ href: `/products/type/${catalogType}`, locale: locale as Locale });
  }

  const visibleTypes = await getVisibleProductTypes();
  if (
    !visibleTypes.includes(type) &&
    !(type === 'mug' && visibleTypes.includes(DRINKWARE_GLASS_NAV_TYPE))
  ) {
    notFound();
  }

  const [{ products, readyDesignEntries, categoryPreviews }, suggestions] =
    await Promise.all([
      getProductTypeCatalogData(catalogType),
      getSuggestedProductsForType(catalogType),
    ]);
  const slimReadyDesignEntries =
    slimProductDesignCatalogEntries(readyDesignEntries);

  return (
    <div className="mx-auto min-w-0 max-w-7xl overflow-x-clip px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<SectionLoading />}>
        <ProductTypeCatalog
          type={catalogType}
          products={products}
          readyDesignEntries={slimReadyDesignEntries}
          categoryPreviews={categoryPreviews}
          suggestions={suggestions}
        />
      </Suspense>
    </div>
  );
}
