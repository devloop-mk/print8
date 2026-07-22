import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProductDesignsCatalog } from '@/components/products/ProductDesignsCatalog';
import { SectionLoading } from '@/components/ui/SectionLoading';
import { getCachedProductDesignCatalogEntries } from '@/lib/cache/catalog-cache';
import { slimProductDesignCatalogEntries } from '@/lib/products/slim-catalog-entry';
import { buildPageMetadata, buildOgImageUrl } from '@/lib/seo/metadata';
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
    title: `${tc('textTemplatesTitle')} | Print 8`,
    description: tc('textTemplatesSubtitle'),
    path: '/products/text-templates',
    image: buildOgImageUrl({
      locale: locale as Locale,
      title: tc('textTemplatesTitle'),
      description: tc('textTemplatesSubtitle'),
      badge: tm('badges.products'),
    }),
  });
}

export default async function ProductTextTemplatesPage() {
  const initialEntries = slimProductDesignCatalogEntries(
    await getCachedProductDesignCatalogEntries('text-designs'),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<SectionLoading />}>
        <ProductDesignsCatalog
          category="text-designs"
          initialEntries={initialEntries}
        />
      </Suspense>
    </div>
  );
}
