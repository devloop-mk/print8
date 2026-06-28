'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { searchGlobalCatalog } from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import {
  SearchCollectionsSection,
  SearchDesignsSection,
  SearchProductDesignsSection,
  SearchProductsSection,
} from '@/components/search/search-result-ui';

export function SearchResults() {
  const t = useTranslations('search');
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';
  const labels = useCatalogSearchLabels();

  const results = useMemo(
    () => searchGlobalCatalog(query, labels),
    [labels, query],
  );

  const grouped = useMemo(
    () => ({
      collection: results.filter((item) => item.kind === 'collection'),
      design: results.filter((item) => item.kind === 'design'),
      product: results.filter((item) => item.kind === 'product'),
      productDesign: results.filter((item) => item.kind === 'product-design'),
    }),
    [results],
  );

  if (!query) {
    return (
      <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-12 text-center text-sm text-ink-500">
        {t('emptyQuery')}
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-12 text-center text-sm text-ink-500">
        {t('noResults', { query })}
      </p>
    );
  }

  return (
    <div className="space-y-10">
      <p className="text-sm text-ink-500">{t('resultsCount', { count: results.length })}</p>

      <SearchCollectionsSection items={grouped.collection} />
      <SearchDesignsSection items={grouped.design} />
      <SearchProductsSection items={grouped.product} />
      <SearchProductDesignsSection items={grouped.productDesign} />
    </div>
  );
}
