'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { products, productTypes } from '@/lib/data/catalog';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
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

  const filterOptions = useMemo(
    () =>
      productTypes.map((type) => ({
        value: type as ProductFilter,
        label: t(`types.${type}`),
      })),
    [t],
  );

  const filtered =
    typeFilter === 'all'
      ? products
      : products.filter((p) => p.type === typeFilter);

  return (
    <>
      <ProductJourneyGuide />

      <Reveal delay={80}>
        <FilterChipBar
        ariaLabel={t('filterLabel')}
        showFiltersLabel={t('showFilters')}
        hideFiltersLabel={t('hideFilters')}
        allOption={{ value: 'all', label: t('allTypes') }}
        options={filterOptions}
        value={typeFilter}
        onChange={setTypeFilter}
        resultsCount={filtered.length}
        resultsLabel={(count) => t('resultsCount', { count })}
        />
      </Reveal>

      <Reveal delay={160}>
        <div id="products-grid">
          <ProductCardGrid items={filtered} />
        </div>
      </Reveal>
    </>
  );
}
