'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LayoutGrid } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { getBrowsableProducts, productTypes, type ProductType } from '@/lib/data/catalog';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import {
  getProductNavCategory,
  parseProductNavCategoryFilter,
  productBelongsToCategory,
  productNavCategories,
  productTypeHref,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import {
  getCategoryCatalogFilterTypes,
  normalizeProductTypeRoute,
  productMatchesCatalogType,
} from '@/lib/products/drinkware-type-groups';
import { sortByDisplayOrder } from '@/lib/products/sort-by-display-order';
import { buildProductTypeFilterOptions } from '@/lib/products/product-type-icons';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import {
  CatalogFilterLayout,
  type CatalogFilterGroup,
} from '@/components/catalog/CatalogFilterLayout';
import { filterProductsBySearchQuery } from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { useCatalogPagination } from '@/hooks/useCatalogPagination';
import {
  filterProductsByInactiveIds,
  filterStorefrontHiddenProductTypes,
} from '@/lib/products/storefront-hidden-types';
import { useVisibleProductTypes } from '@/components/layout/ProductVisibilityProvider';
import { Reveal } from '@/components/motion/Reveal';

type ProductFilter = ProductType | 'all';

function buildProductsHubHref(category: ProductNavCategoryId | 'all'): string {
  return category === 'all' ? '/products' : `/products?category=${category}`;
}

/**
 * Printful-style catalog: a sticky left sidebar (category + product type
 * navigation, search) next to the main product grid. This powers the
 * top-level `/products` hub — the sidebar filters in place via query params
 * instead of introducing a separate taxonomy.
 */
export function ProductsHubCatalog({
  displayOrder,
  inactiveProductIds = [],
}: {
  displayOrder?: Record<string, number>;
  inactiveProductIds?: readonly string[];
} = {}) {
  const t = useTranslations('products');
  const tCatalog = useTranslations('products.catalog');
  const tNav = useTranslations('nav.productsMenu.categories');
  const ts = useTranslations('search');
  const searchLabels = useCatalogSearchLabels();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductNavCategoryId | 'all'>(() =>
    parseProductNavCategoryFilter(searchParams.get('category')),
  );
  const [typeFilter, setTypeFilter] = useState<ProductFilter>(() =>
    parseProductTypeFilter(searchParams.get('type')),
  );
  const visibleProductTypes = useVisibleProductTypes();
  const visibleTypeSet = visibleProductTypes
    ? new Set(visibleProductTypes)
    : null;

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && (productTypes as readonly string[]).includes(typeParam)) {
      router.replace(productTypeHref(normalizeProductTypeRoute(typeParam as ProductType)));
      return;
    }
    setCategoryFilter(parseProductNavCategoryFilter(searchParams.get('category')));
    setTypeFilter(parseProductTypeFilter(typeParam));
  }, [searchParams, router]);

  const browsableProducts = useMemo(
    () =>
      sortByDisplayOrder(
        filterStorefrontHiddenProductTypes(
          filterProductsByInactiveIds(getBrowsableProducts(), inactiveProductIds),
        ),
        displayOrder,
      ),
    [displayOrder, inactiveProductIds],
  );

  const scopedProducts = useMemo(() => {
    return categoryFilter === 'all'
      ? browsableProducts
      : browsableProducts.filter((product) =>
          productBelongsToCategory(product, categoryFilter),
        );
  }, [browsableProducts, categoryFilter]);

  const categoryOptions = useMemo(
    () =>
      productNavCategories.map((category) => ({
        value: category.id,
        label: tNav(category.id),
        icon: category.icon,
      })),
    [tNav],
  );

  const { allOption, options: filterOptions } = useMemo(() => {
    const built = buildProductTypeFilterOptions((type) =>
      type === 'all' ? t('allTypes') : t(`typesPlural.${type}`),
    );

    const typeFiltered = visibleTypeSet
      ? {
          allOption: built.allOption,
          options: built.options.filter((option) =>
            visibleTypeSet.has(option.value),
          ),
        }
      : built;

    if (categoryFilter === 'all') return typeFiltered;

    const allowed = new Set(getCategoryCatalogFilterTypes(getProductNavCategory(categoryFilter).types));
    return {
      allOption: typeFiltered.allOption,
      options: typeFiltered.options.filter((option) => allowed.has(option.value)),
    };
  }, [categoryFilter, t, visibleTypeSet]);

  const filteredByType =
    typeFilter === 'all'
      ? scopedProducts
      : scopedProducts.filter((product) => productMatchesCatalogType(product, typeFilter));

  // Debounced in CatalogFilterLayout; defer grid work so sidebar/layout stay stable while typing.
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const filtered = useMemo(
    () =>
      filterProductsBySearchQuery(filteredByType, deferredSearchQuery, searchLabels),
    [filteredByType, deferredSearchQuery, searchLabels],
  );

  const filterSignature = useMemo(
    () => [categoryFilter, typeFilter, deferredSearchQuery.trim()].join('|'),
    [categoryFilter, deferredSearchQuery, typeFilter],
  );

  const { page, setPage, resetPage, paginate } = useCatalogPagination({
    totalItems: filtered.length,
  });

  const prevFilterSignature = useRef(filterSignature);
  useEffect(() => {
    if (prevFilterSignature.current === filterSignature) return;
    prevFilterSignature.current = filterSignature;
    resetPage();
  }, [filterSignature, resetPage]);

  const visibleProducts = useMemo(() => paginate(filtered), [filtered, paginate]);

  function updateCategory(next: ProductNavCategoryId | 'all') {
    setCategoryFilter(next);
    setTypeFilter('all');
    router.replace(buildProductsHubHref(next), { scroll: false });
  }

  function updateType(next: ProductFilter) {
    if (next === 'all') {
      setTypeFilter('all');
      router.replace(buildProductsHubHref(categoryFilter), { scroll: false });
      return;
    }
    router.replace(productTypeHref(next));
  }

  const filterGroups = useMemo((): CatalogFilterGroup[] => [
    {
      kind: 'options',
      id: 'category',
      title: t('filterGroups.category'),
      allOption: { value: 'all', label: t('allCategories'), icon: LayoutGrid },
      options: categoryOptions,
      value: categoryFilter,
      onChange: (value) => updateCategory(value as ProductNavCategoryId | 'all'),
    },
    {
      kind: 'options',
      id: 'productType',
      title: t('filterGroups.productType'),
      allOption,
      options: filterOptions,
      value: typeFilter,
      onChange: (value) => updateType(value as ProductFilter),
    },
  ], [allOption, categoryFilter, categoryOptions, filterOptions, t, typeFilter]);

  return (
    <CatalogFilterLayout
      groups={filterGroups}
      ariaLabel={t('filterLabel')}
      showFiltersLabel={t('showFilters')}
      hideFiltersLabel={t('hideFilters')}
      resultsCount={filtered.length}
      resultsLabel={(count) => t('resultsCount', { count })}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={t('searchPlaceholder')}
      searchAriaLabel={t('searchAriaLabel')}
      searchClearLabel={ts('clear')}
    >
      <Reveal delay={80}>
        <div id="products-grid" className="scroll-mt-24">
          <ProductCardGrid items={visibleProducts} linkTarget="detail" />
          <CatalogPagination
            page={page}
            totalItems={filtered.length}
            onPageChange={setPage}
            previousLabel={tCatalog('paginationPrevious')}
            nextLabel={tCatalog('paginationNext')}
            pageLabel={(current, total) => tCatalog('paginationPage', { current, total })}
          />
        </div>
      </Reveal>
    </CatalogFilterLayout>
  );
}
