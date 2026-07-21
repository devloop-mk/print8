'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  type ProductDesignCategory,
  type ProductType,
} from '@/lib/data/catalog';
import { buildProductTypeFilterOptions } from '@/lib/products/product-type-icons';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import {
  getProductNavCategory,
  parseProductNavCategoryFilter,
  productBelongsToCategory,
  productCategoryHref,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import {
  filterDesignCatalogEntries,
  getCatalogColors,
  getProductDesignCatalogEntries,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import {
  parseDesignCatalogSort,
  sortDesignCatalogItems,
  type DesignCatalogSort,
} from '@/lib/products/design-catalog-sort';
import {
  COUPLES_DESIGN_COLLECTION,
  KIDS_DESIGN_COLLECTION,
  PRODUCT_OFFERING_PATHS,
} from '@/lib/products/paths';
import {
  CatalogFilterLayout,
  type CatalogFilterGroup,
} from '@/components/catalog/CatalogFilterLayout';
import { CatalogSortSelect } from '@/components/catalog/CatalogSortSelect';
import { ProductDesignCatalogCard } from '@/components/products/ProductDesignCatalogCard';
import { CouplePackCard } from '@/components/products/CouplePackCard';
import {
  getCouplePackTemplates,
  type CouplePackTemplate,
} from '@/lib/data/couple-pack';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import {
  filterProductDesignEntriesBySearchQuery,
} from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import { Reveal } from '@/components/motion/Reveal';
import { CatalogGridLayout } from '@/components/catalog/CatalogGrid';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { useCatalogPagination } from '@/hooks/useCatalogPagination';

type ProductDesignsCatalogProps = {
  category: ProductDesignCategory;
  /** Server-merged catalog entries (includes admin applicableColors). */
  initialEntries?: ProductDesignCatalogEntry[];
  /** Server-merged couple partner templates keyed by designId. */
  initialCoupleDesigns?: Record<string, ProductDesignTemplate>;
};

type TypeFilter = ProductType | 'all';

const COLLECTION_LABELS: Record<string, { en: string; mk: string }> = {
  basketball: { en: 'Basketball', mk: 'Кошарка' },
  anime: { en: 'Japanese Anime', mk: 'Јапонско аниме' },
  typography: { en: 'Streetwear Typography', mk: 'Стритвер типографија' },
  streetwear: { en: 'Streetwear', mk: 'Стритвер' },
  'baby-milestones': { en: 'Baby milestones', mk: 'Беби пресвртници' },
  'couple-packs': { en: 'Couple packs', mk: 'Парски пакети' },
  'trending-mk': { en: 'Trending MK', mk: 'Тренд МК' },
  family: { en: 'Family', mk: 'Семејство' },
  'kids-birthday': { en: 'Kids & birthday', mk: 'Деца и роденден' },
  'local-mk': { en: 'Local designs', mk: 'Локални дизајни' },
  'caps-local': { en: 'Caps', mk: 'Капи' },
  'bags-local': { en: 'Bags', mk: 'Торби' },
  drinkware: { en: 'Drinkware', mk: 'Шолји' },
  'family-gifts': { en: 'Family gifts', mk: 'Семејни подароци' },
};

export function ProductDesignsCatalog({
  category,
  initialEntries,
  initialCoupleDesigns,
}: ProductDesignsCatalogProps) {
  const t = useTranslations('products');
  const locale = useLocale() as 'mk' | 'en';
  const tc = useTranslations('products.catalog');
  const tcat = useTranslations('products.categoryPages');
  const tNav = useTranslations('nav.productsMenu.categories');
  const ts = useTranslations('search');
  const searchLabels = useCatalogSearchLabels();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const categoryFilter = parseProductNavCategoryFilter(
    searchParams.get('category'),
  );

  const allEntries = useMemo(() => {
    const entries =
      initialEntries ?? getProductDesignCatalogEntries(category);
    if (categoryFilter === 'all') return entries;

    return entries
      .map((entry) => ({
        design: entry.design,
        products: entry.products.filter((product) =>
          productBelongsToCategory(product, categoryFilter),
        ),
      }))
      .filter((entry) => entry.products.length > 0);
  }, [category, categoryFilter, initialEntries]);

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(() =>
    parseProductTypeFilter(searchParams.get('type')),
  );
  const [colorFilter, setColorFilter] = useState<string | 'all'>('all');
  const [collectionFilter, setCollectionFilter] = useState<string | 'all'>(() => {
    const fromUrl = searchParams.get('collection');
    return fromUrl && fromUrl.trim() ? fromUrl.trim() : 'all';
  });
  const [sort, setSort] = useState<DesignCatalogSort>(() =>
    parseDesignCatalogSort(searchParams.get('sort')),
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fromUrl = searchParams.get('collection');
    const next = fromUrl && fromUrl.trim() ? fromUrl.trim() : 'all';
    setCollectionFilter(next);
    setSort(parseDesignCatalogSort(searchParams.get('sort')));
  }, [searchParams]);

  function handleSortChange(next: DesignCatalogSort) {
    setSort(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'featured') params.delete('sort');
    else params.set('sort', next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const availableColors = useMemo(
    () => getCatalogColors(allEntries),
    [allEntries],
  );

  const couplePackPartnerIds = useMemo(() => {
    return new Set(
      getCouplePackTemplates().flatMap((pack) =>
        pack.partnerDesigns.map((partner) => partner.designId),
      ),
    );
  }, []);

  /** Designs matching the active product-type (+ search) — drives collection facet options. */
  const entriesForCollectionOptions = useMemo(() => {
    const byType = filterDesignCatalogEntries(allEntries, {
      type: typeFilter,
      color: 'all',
    }).filter((entry) => !couplePackPartnerIds.has(entry.design.id));

    if (!searchQuery.trim()) return byType;

    return filterProductDesignEntriesBySearchQuery(
      byType,
      searchQuery,
      searchLabels,
    );
  }, [
    allEntries,
    couplePackPartnerIds,
    searchLabels,
    searchQuery,
    typeFilter,
  ]);

  const collectionOptions = useMemo(() => {
    const collections = new Set<string>();
    for (const entry of entriesForCollectionOptions) {
      if (entry.design.collection) collections.add(entry.design.collection);
    }

    // Couple packs are listed separately — include their collection when any pack matches.
    let packs = getCouplePackTemplates();
    if (categoryFilter !== 'all') {
      packs = packs.filter((pack) =>
        pack.productTypes.some((type) =>
          productBelongsToCategory({ type }, categoryFilter),
        ),
      );
    }
    if (typeFilter !== 'all') {
      packs = packs.filter((pack) => pack.productTypes.includes(typeFilter));
    }
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      packs = packs.filter((pack) => {
        const haystack = `${pack.titleEn} ${pack.titleMk} ${pack.partnerDesigns
          .map((partner) => `${partner.labelEn} ${partner.labelMk}`)
          .join(' ')}`.toLowerCase();
        return haystack.includes(query);
      });
    }
    if (packs.length > 0) {
      collections.add(COUPLES_DESIGN_COLLECTION);
    }

    return [...collections]
      .map((value) => ({
        value,
        label:
          locale === 'mk'
            ? (COLLECTION_LABELS[value]?.mk ?? value)
            : (COLLECTION_LABELS[value]?.en ?? value),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [
    categoryFilter,
    entriesForCollectionOptions,
    locale,
    searchQuery,
    typeFilter,
  ]);

  const { allOption, options: typeOptions } = useMemo(() => {
    const built = buildProductTypeFilterOptions((type) =>
      type === 'all' ? t('allTypes') : t(`typesPlural.${type}`),
    );

    let options = built.options;
    if (categoryFilter !== 'all') {
      const allowed = new Set(getProductNavCategory(categoryFilter).types);
      options = options.filter((option) => allowed.has(option.value));
    }

    // Narrow product types to those present in the selected collection.
    if (collectionFilter !== 'all') {
      const typesInCollection = new Set<ProductType>();
      for (const entry of allEntries) {
        if (couplePackPartnerIds.has(entry.design.id)) continue;
        if (entry.design.collection !== collectionFilter) continue;
        for (const product of entry.products) {
          typesInCollection.add(product.type);
        }
      }
      if (collectionFilter === COUPLES_DESIGN_COLLECTION) {
        for (const pack of getCouplePackTemplates()) {
          if (
            categoryFilter !== 'all' &&
            !pack.productTypes.some((type) =>
              productBelongsToCategory({ type }, categoryFilter),
            )
          ) {
            continue;
          }
          for (const type of pack.productTypes) {
            typesInCollection.add(type);
          }
        }
      }
      options = options.filter((option) => typesInCollection.has(option.value));
    }

    return {
      allOption: built.allOption,
      options,
    };
  }, [allEntries, categoryFilter, collectionFilter, couplePackPartnerIds, t]);

  // Drop a collection that no longer has designs for the current type/search.
  useEffect(() => {
    if (collectionFilter === 'all') return;
    if (collectionOptions.some((option) => option.value === collectionFilter)) {
      return;
    }
    setCollectionFilter('all');
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has('collection')) return;
    params.delete('collection');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    collectionFilter,
    collectionOptions,
    pathname,
    router,
    searchParams,
  ]);

  // Drop a product type that is not present in the selected collection.
  useEffect(() => {
    if (typeFilter === 'all') return;
    if (typeOptions.some((option) => option.value === typeFilter)) return;
    setTypeFilter('all');
  }, [typeFilter, typeOptions]);

  const filteredByAttributes = useMemo(
    () =>
      filterDesignCatalogEntries(allEntries, {
        type: typeFilter,
        color: colorFilter,
      })
        .filter((entry) => !couplePackPartnerIds.has(entry.design.id))
        .filter((entry) =>
          collectionFilter === 'all'
            ? true
            : entry.design.collection === collectionFilter,
        ),
    [
      allEntries,
      typeFilter,
      colorFilter,
      collectionFilter,
      couplePackPartnerIds,
    ],
  );

  const visibleCouplePacks = useMemo(() => {
    let packs = getCouplePackTemplates();

    if (
      collectionFilter !== 'all' &&
      collectionFilter !== COUPLES_DESIGN_COLLECTION
    ) {
      return [] as CouplePackTemplate[];
    }

    // Nav category (e.g. bags) must exclude tee couple packs — they only
    // honor type/collection filters today, so category=bags leaked them in.
    if (categoryFilter !== 'all') {
      packs = packs.filter((pack) =>
        pack.productTypes.some((type) =>
          productBelongsToCategory({ type }, categoryFilter),
        ),
      );
    }

    if (typeFilter !== 'all') {
      packs = packs.filter((pack) => pack.productTypes.includes(typeFilter));
    }

    if (colorFilter !== 'all') {
      packs = packs.filter((pack) => {
        if (!pack.applicableColors?.length) return true;
        return pack.applicableColors.some(
          (color) =>
            color.toLowerCase() === colorFilter.toLowerCase() ||
            (colorFilter.toLowerCase() === '#c5ccd6' &&
              color.toLowerCase() === '#ffffff') ||
            (colorFilter.toLowerCase() === '#1c1a1d' &&
              color.toLowerCase() === '#000000'),
        );
      });
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return packs;

    return packs.filter((pack) => {
      const haystack = `${pack.titleEn} ${pack.titleMk} ${pack.partnerDesigns
        .map((partner) => `${partner.labelEn} ${partner.labelMk}`)
        .join(' ')}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [categoryFilter, collectionFilter, typeFilter, colorFilter, searchQuery]);

  const filtered = useMemo(
    () =>
      filterProductDesignEntriesBySearchQuery(
        filteredByAttributes,
        searchQuery,
        searchLabels,
      ),
    [filteredByAttributes, searchQuery, searchLabels],
  );

  const filterSignature = useMemo(
    () =>
      [
        categoryFilter,
        typeFilter,
        colorFilter,
        collectionFilter,
        searchQuery.trim(),
        sort,
      ].join('|'),
    [
      categoryFilter,
      collectionFilter,
      colorFilter,
      searchQuery,
      sort,
      typeFilter,
    ],
  );

  const catalogItems = useMemo(
    () =>
      sortDesignCatalogItems(
        [
          ...visibleCouplePacks.map((pack) => ({
            kind: 'couple-pack' as const,
            pack,
          })),
          ...filtered.map((entry) => ({ kind: 'design' as const, entry })),
        ],
        sort,
        {
          locale,
          colorFilter,
          translateName: (key) => t(key),
        },
      ),
    [colorFilter, filtered, locale, sort, t, visibleCouplePacks],
  );

  const { page, setPage, resetPage, paginate } = useCatalogPagination({
    totalItems: catalogItems.length,
  });

  const prevFilterSignature = useRef(filterSignature);
  useEffect(() => {
    if (prevFilterSignature.current === filterSignature) return;
    prevFilterSignature.current = filterSignature;
    resetPage();
  }, [filterSignature, resetPage]);

  const visibleItems = useMemo(
    () => paginate(catalogItems),
    [catalogItems, paginate],
  );

  const pageTitle =
    category === 'image-designs'
      ? tc('readyDesignsTitle')
      : tc('textTemplatesTitle');
  const pageSubtitle =
    category === 'image-designs'
      ? tc('readyDesignsSubtitle')
      : tc('textTemplatesSubtitle');

  const backHref =
    categoryFilter === 'all'
      ? PRODUCT_OFFERING_PATHS.all
      : productCategoryHref(categoryFilter);
  const backLabel =
    categoryFilter === 'all' ? tc('backToProducts') : tcat('backToCategory');

  const filterGroups = useMemo((): CatalogFilterGroup[] => {
    const groups: CatalogFilterGroup[] = [
      {
        kind: 'options',
        id: 'productType',
        title: t('filterGroups.productType'),
        allOption,
        options: typeOptions,
        value: typeFilter,
        onChange: (value) => setTypeFilter(value as TypeFilter),
      },
    ];

    if (availableColors.length > 0) {
      groups.push({
        kind: 'colors',
        id: 'color',
        title: tc('filterColor'),
        colors: availableColors,
        value: colorFilter,
        onChange: setColorFilter,
        allLabel: tc('allColors'),
      });
    }

    if (collectionOptions.length > 0) {
      groups.unshift({
        kind: 'pills',
        id: 'collection',
        title: tc('filterCollection'),
        options: [
          { value: 'all' as const, label: tc('allCollections') },
          ...collectionOptions.map((option) => ({
            value: option.value,
            label: option.label,
          })),
        ],
        value: collectionFilter,
        onChange: (value) => {
          if (value === KIDS_DESIGN_COLLECTION) {
            router.push(PRODUCT_OFFERING_PATHS.kidsReadyDesigns);
            return;
          }
          if (value === COUPLES_DESIGN_COLLECTION) {
            router.push(PRODUCT_OFFERING_PATHS.couplesReadyDesigns);
            return;
          }
          setCollectionFilter(value);
        },
      });
    }

    return groups;
  }, [
    allOption,
    availableColors,
    colorFilter,
    collectionFilter,
    collectionOptions,
    router,
    t,
    tc,
    typeFilter,
    typeOptions,
  ]);

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
        <h1 className="mt-1 text-3xl font-bold text-ink-900">{pageTitle}</h1>
        <p className="mt-2 text-ink-600">{pageSubtitle}</p>
      </div>

      <Reveal delay={40}>
        <CatalogFilterLayout
          groups={filterGroups}
          ariaLabel={t('filterLabel')}
          showFiltersLabel={t('showFilters')}
          hideFiltersLabel={t('hideFilters')}
          resultsCount={catalogItems.length}
          resultsLabel={(count) => tc('resultsDesigns', { count })}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('searchPlaceholder')}
          searchAriaLabel={t('searchAriaLabel')}
          searchClearLabel={ts('clear')}
        >
          {catalogItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-12 text-center text-sm text-ink-500">
              {tc('noDesigns')}
            </p>
          ) : (
            <Reveal delay={80}>
              <CatalogGridLayout
                toolbarStart={
                  <CatalogSortSelect value={sort} onChange={handleSortChange} />
                }
              >
                {visibleItems.map((item) =>
                  item.kind === 'couple-pack' ? (
                    <CouplePackCard
                      key={item.pack.id}
                      pack={item.pack}
                      colorFilter={colorFilter}
                      initialDesigns={initialCoupleDesigns}
                    />
                  ) : (
                    <ProductDesignCatalogCard
                      key={item.entry.design.id}
                      entry={item.entry}
                      colorFilter={colorFilter}
                      preferredProductType={
                        typeFilter === 'all' ? undefined : typeFilter
                      }
                    />
                  ),
                )}
              </CatalogGridLayout>
              <CatalogPagination
                page={page}
                totalItems={catalogItems.length}
                onPageChange={setPage}
                previousLabel={tc('paginationPrevious')}
                nextLabel={tc('paginationNext')}
                pageLabel={(current, total) =>
                  tc('paginationPage', { current, total })
                }
              />
            </Reveal>
          )}
        </CatalogFilterLayout>
      </Reveal>
    </div>
  );
}
