'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';
import { products, type ProductType } from '@/lib/data/catalog';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import { buildProductTypeFilterOptions } from '@/lib/products/product-type-icons';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { FilterChipBar } from '@/components/catalog/FilterChipBar';
import { Reveal } from '@/components/motion/Reveal';

type ProductFilter = ProductType | 'all';

export function ProductCustomCatalog() {
  const t = useTranslations('products');
  const tc = useTranslations('products.catalog');
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
      : products.filter((product) => product.type === typeFilter);

  return (
    <div className="space-y-8">
      <Link
        href={PRODUCT_OFFERING_PATHS.all}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc('backToProducts')}
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-ink-900">{tc('customTitle')}</h1>
        <p className="mt-2 text-ink-600">{tc('customSubtitle')}</p>
      </div>

      <Reveal delay={40}>
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

      <Reveal delay={80}>
        <ProductCardGrid items={filtered} />
      </Reveal>
    </div>
  );
}
