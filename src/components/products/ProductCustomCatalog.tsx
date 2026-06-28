'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { products, productTypes, type ProductType } from '@/lib/data/catalog';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import {
  getProductNavCategory,
  parseProductNavCategoryFilter,
  productBelongsToCategory,
  productCategoryHref,
  productTypeHref,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import { buildProductTypeFilterOptions } from '@/lib/products/product-type-icons';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { FilterChipBar } from '@/components/catalog/FilterChipBar';
import { Reveal } from '@/components/motion/Reveal';

type ProductFilter = ProductType | 'all';

export function ProductCustomCatalog() {
  const t = useTranslations('products');
  const tc = useTranslations('products.catalog');
  const tcat = useTranslations('products.categoryPages');
  const tNav = useTranslations('nav.productsMenu.categories');
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryFilter = parseProductNavCategoryFilter(
    searchParams.get('category'),
  );
  const [typeFilter, setTypeFilter] = useState<ProductFilter>(() =>
    parseProductTypeFilter(searchParams.get('type')),
  );

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (
      typeParam &&
      (productTypes as readonly string[]).includes(typeParam)
    ) {
      router.replace(productTypeHref(typeParam as ProductType));
      return;
    }
    setTypeFilter(parseProductTypeFilter(typeParam));
  }, [searchParams, router]);

  const scopedProducts = useMemo(() => {
    if (categoryFilter === 'all') return products;
    return products.filter((product) =>
      productBelongsToCategory(product, categoryFilter),
    );
  }, [categoryFilter]);

  const { allOption, options: filterOptions } = useMemo(() => {
    const built = buildProductTypeFilterOptions((type) =>
      type === 'all' ? t('allTypes') : t(`typesPlural.${type}`),
    );

    if (categoryFilter === 'all') return built;

    const allowed = new Set(getProductNavCategory(categoryFilter).types);
    return {
      allOption: built.allOption,
      options: built.options.filter((option) => allowed.has(option.value)),
    };
  }, [categoryFilter, t]);

  const filtered =
    typeFilter === 'all'
      ? scopedProducts
      : scopedProducts.filter((product) => product.type === typeFilter);

  const backHref =
    categoryFilter === 'all'
      ? PRODUCT_OFFERING_PATHS.all
      : productCategoryHref(categoryFilter);
  const backLabel =
    categoryFilter === 'all' ? tc('backToProducts') : tcat('backToCategory');

  return (
    <div className="w-full min-w-0 max-w-full space-y-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="max-w-3xl">
        {categoryFilter !== 'all' ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            {tNav(categoryFilter as ProductNavCategoryId)}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-bold text-ink-900">{tc('customTitle')}</h1>
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
          mobileLayout="collapse"
        />
      </Reveal>

      <Reveal delay={80}>
        <ProductCardGrid items={filtered} />
      </Reveal>
    </div>
  );
}
