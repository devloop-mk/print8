import { ProductDesignsPage } from '@/components/products/ProductDesignsPage';
import { products } from '@/lib/data/catalog';
import { getCachedReadyDesignEntriesForType } from '@/lib/cache/catalog-cache';
import { filterDesignCatalogEntriesForProduct } from '@/lib/products/design-catalog';
import { slimProductDesignCatalogEntries } from '@/lib/products/slim-catalog-entry';
import { resolveProductId } from '@/lib/products/product-id-aliases';
import { buildProductPremadeDesignsMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

/** Merged catalog payload — match type-page ready designs. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const canonicalId = resolveProductId(id);
  const metadata = await buildProductPremadeDesignsMetadata(
    locale as Locale,
    canonicalId,
  );
  if (!metadata) notFound();
  return metadata;
}

export default async function ProductPremadeDesignsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const canonicalId = resolveProductId(id);
  const product = products.find((item) => item.id === canonicalId);

  if (!product) {
    notFound();
  }

  const typeEntries = await getCachedReadyDesignEntriesForType(
    product.type,
    'image-designs',
  );
  const entries = slimProductDesignCatalogEntries(
    filterDesignCatalogEntriesForProduct(typeEntries, product),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ProductDesignsPage
        productId={canonicalId}
        entries={entries}
        category="image-designs"
      />
    </div>
  );
}
