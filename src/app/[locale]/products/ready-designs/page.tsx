import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProductDesignsCatalog } from '@/components/products/ProductDesignsCatalog';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { getCachedProductDesignCatalogEntries } from '@/lib/cache/catalog-cache';
import { resolveCouplePackDesignTemplatesMap } from '@/lib/products/couple-pack-resolved';
import {
  slimProductDesignCatalogEntries,
  slimProductDesignMap,
} from '@/lib/products/slim-catalog-entry';
import { buildPageMetadata, buildOgImageUrl } from '@/lib/seo/metadata';
import { redirect } from '@/i18n/navigation';
import {
  COUPLES_DESIGN_COLLECTION,
  KIDS_DESIGN_COLLECTION,
  PRODUCT_OFFERING_PATHS,
} from '@/lib/products/paths';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import { productTypeHref } from '@/lib/products/product-nav';
import type { Locale } from '@/i18n/routing';

/** Fat catalog payload — skip ISR writes; render on demand. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  const tc = await getTranslations({ locale, namespace: 'products.catalog' });

  return buildPageMetadata({
    locale: locale as Locale,
    title: `${tc('readyDesignsTitle')} | Print 8`,
    description: tc('readyDesignsSubtitle'),
    path: '/products/ready-designs',
    image: buildOgImageUrl({
      locale: locale as Locale,
      title: tc('readyDesignsTitle'),
      description: tc('readyDesignsSubtitle'),
      badge: tm('badges.products'),
    }),
  });
}

export default async function ProductReadyDesignsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;

  const collectionRaw = query.collection;
  const collection = Array.isArray(collectionRaw)
    ? collectionRaw[0]
    : collectionRaw;

  if (collection === KIDS_DESIGN_COLLECTION) {
    redirect({
      href: PRODUCT_OFFERING_PATHS.kidsReadyDesigns,
      locale: locale as Locale,
    });
  }

  if (collection === COUPLES_DESIGN_COLLECTION) {
    redirect({
      href: PRODUCT_OFFERING_PATHS.couplesReadyDesigns,
      locale: locale as Locale,
    });
  }

  // Type-scoped browsing belongs on /products/type/[type] (optionally with collection).
  const typeRaw = query.type;
  const typeValue = Array.isArray(typeRaw) ? typeRaw[0] : typeRaw;
  const typeFilter = parseProductTypeFilter(typeValue ?? null);
  if (typeFilter !== 'all') {
    const preserved = new URLSearchParams();
    if (collection?.trim()) {
      preserved.set('collection', collection.trim());
    }
    const pageRaw = query.page;
    const page = Array.isArray(pageRaw) ? pageRaw[0] : pageRaw;
    if (page?.trim()) preserved.set('page', page.trim());
    const sortRaw = query.sort;
    const sort = Array.isArray(sortRaw) ? sortRaw[0] : sortRaw;
    if (sort?.trim()) preserved.set('sort', sort.trim());

    const base = productTypeHref(typeFilter);
    const qs = preserved.toString();
    redirect({
      href: qs ? `${base}?${qs}` : base,
      locale: locale as Locale,
    });
  }

  const [rawEntries, rawCoupleDesigns] = await Promise.all([
    getCachedProductDesignCatalogEntries('image-designs'),
    resolveCouplePackDesignTemplatesMap(),
  ]);
  const initialEntries = slimProductDesignCatalogEntries(rawEntries);
  const initialCoupleDesigns = slimProductDesignMap(rawCoupleDesigns);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<SectionLoading />}>
        <ProductDesignsCatalog
          category="image-designs"
          initialEntries={initialEntries}
          initialCoupleDesigns={initialCoupleDesigns}
        />
      </Suspense>
    </div>
  );
}
