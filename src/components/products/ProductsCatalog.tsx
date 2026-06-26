'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { products, productTypes, type ProductType } from '@/lib/data/catalog';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import { productTypeHref } from '@/lib/products/product-nav';
import { buildProductTypeFilterOptions } from '@/lib/products/product-type-icons';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { FilterChipBar } from '@/components/catalog/FilterChipBar';
import { ProductJourneyGuide } from '@/components/products/ProductJourneyGuide';
import { Reveal } from '@/components/motion/Reveal';

type ProductFilter = ProductType | 'all';

function isProductType(value: string): value is ProductType {
  return (productTypes as readonly string[]).includes(value);
}

export function ProductsCatalog() {
  const t = useTranslations('products');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState<ProductFilter>(() =>
    parseProductTypeFilter(searchParams.get('type')),
  );

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && isProductType(typeParam)) {
      router.replace(productTypeHref(typeParam));
      return;
    }
    setTypeFilter(parseProductTypeFilter(typeParam));
  }, [searchParams, router]);

  const { allOption, options: filterOptions } = useMemo(
    () =>
      buildProductTypeFilterOptions((type) =>
        type === 'all' ? t('allTypes') : t(`typesPlural.${type}`),
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
