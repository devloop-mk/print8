'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { products } from '@/lib/data/catalog';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import { buildProductTypeFilterOptions } from '@/lib/products/product-type-icons';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { FilterChipBar } from '@/components/catalog/FilterChipBar';
import { ProductJourneyGuide } from '@/components/products/ProductJourneyGuide';
import { Reveal } from '@/components/motion/Reveal';
import type { ProductType } from '@/lib/data/catalog';

type ProductFilter = ProductType | 'all';

export function ProductsCatalog() {
  const t = useTranslations('products');
  const searchParams = useSearchParams();
  const [typeFilter, setTypeFilter] = useState<ProductFilter>(() =>
    parseProductTypeFilter(searchParams.get('type')),
  );

  useEffect(() => {
    setTypeFilter(parseProductTypeFilter(searchParams.get('type')));
  }, [searchParams]);

  const { allOption, options: filterOptions } = useMemo(
    () =>
      buildProductTypeFilterOptions((type) =>
        type === 'all' ? t('allTypes') : t(`types.${type}`),
      ),
    [t],
  );

  const filtered =
    typeFilter === 'all'
      ? products
      : products.filter((p) => p.type === typeFilter);

  return (
    <>
      <Reveal>
        <FilterChipBar
          ariaLabel={t('filterLabel')}
          showFiltersLabel={t('showFilters')}
          hideFiltersLabel={t('hideFilters')}
          allOption={allOption}
          options={filterOptions}
          value={typeFilter}
          onChange={setTypeFilter}
          resultsCount={filtered.length}
          resultsLabel={(count) => t('resultsCount', { count })}
          mobileLayout="scroll"
        />
      </Reveal>

      <ProductJourneyGuide />

      <Reveal delay={80}>
        <div id="products-grid" className="scroll-mt-24">
          <ProductCardGrid items={filtered} />
        </div>
      </Reveal>
    </>
  );
}
