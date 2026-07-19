'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  SEARCH_RESULTS_PREVIEW_LIMIT,
  getFeaturedCatalogResults,
  searchGlobalCatalog,
} from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import { useManagedDesignSearchEntries } from '@/hooks/useManagedDesignSearchEntries';
import {
  SearchCollectionsSection,
  SearchDesignsSection,
  SearchProductDesignsSection,
  SearchProductsSection,
} from '@/components/search/search-result-ui';
import { Button } from '@/components/ui/Button';

export function SearchResults() {
  const t = useTranslations('search');
  const searchParams = useSearchParams();
  const query = searchParams.get('q')?.trim() ?? '';
  const labels = useCatalogSearchLabels();
  const managedDesigns = useManagedDesignSearchEntries();
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [query]);

  const results = useMemo(
    () => searchGlobalCatalog(query, labels, managedDesigns),
    [labels, managedDesigns, query],
  );

  const featuredResults = useMemo(
    () => getFeaturedCatalogResults(labels, managedDesigns, 12),
    [labels, managedDesigns],
  );

  const visibleResults = useMemo(
    () =>
      expanded ? results : results.slice(0, SEARCH_RESULTS_PREVIEW_LIMIT),
    [expanded, results],
  );

  const grouped = useMemo(
    () => ({
      collection: visibleResults.filter((item) => item.kind === 'collection'),
      design: visibleResults.filter((item) => item.kind === 'design'),
      product: visibleResults.filter((item) => item.kind === 'product'),
      productDesign: visibleResults.filter(
        (item) => item.kind === 'product-design',
      ),
    }),
    [visibleResults],
  );

  const featuredGrouped = useMemo(
    () => ({
      collection: featuredResults.filter((item) => item.kind === 'collection'),
      design: featuredResults.filter((item) => item.kind === 'design'),
      product: featuredResults.filter((item) => item.kind === 'product'),
      productDesign: featuredResults.filter(
        (item) => item.kind === 'product-design',
      ),
    }),
    [featuredResults],
  );

  const hasMore = results.length > SEARCH_RESULTS_PREVIEW_LIMIT && !expanded;
  const hiddenCount = results.length - SEARCH_RESULTS_PREVIEW_LIMIT;

  if (!query) {
    return (
      <div className="space-y-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">
          {t('featuredHeading')}
        </p>
        <SearchProductDesignsSection items={featuredGrouped.productDesign} />
        <SearchProductsSection items={featuredGrouped.product} />
        <SearchDesignsSection items={featuredGrouped.design} />
        <SearchCollectionsSection items={featuredGrouped.collection} />
      </div>
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
      <p className="text-sm text-ink-500">
        {hasMore
          ? t('resultsCountPreview', {
              shown: SEARCH_RESULTS_PREVIEW_LIMIT,
              total: results.length,
            })
          : t('resultsCount', { count: results.length })}
      </p>

      <SearchCollectionsSection items={grouped.collection} />
      <SearchDesignsSection items={grouped.design} />
      <SearchProductsSection items={grouped.product} />
      <SearchProductDesignsSection items={grouped.productDesign} />

      {hasMore ? (
        <div className="flex justify-center border-t border-ink-100 pt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => setExpanded(true)}
          >
            {t('seeMore', { count: hiddenCount })}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
