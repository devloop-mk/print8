'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  SEARCH_RESULTS_PREVIEW_LIMIT,
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

  const hasMore = results.length > SEARCH_RESULTS_PREVIEW_LIMIT && !expanded;
  const hiddenCount = results.length - SEARCH_RESULTS_PREVIEW_LIMIT;

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
