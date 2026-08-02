'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  products,
  getProductDesignTemplates,
  getProductDesignTemplatesByCategory,
  type ProductDesignCategory,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { getProductPaths } from '@/lib/products/paths';
import { getProductDisplayPrice } from '@/lib/products/tshirt-print-pricing';
import { getDesignApplicableColors } from '@/lib/products/design-applicable-colors';
import {
  designSupportsGarmentFit,
  getProductGarmentFit,
} from '@/lib/products/garment-fit';
import { normalizeHex } from '@/lib/products/design-overlay';
import { formatPrice } from '@/lib/utils';
import { ProductDesignSection } from '@/components/products/ProductDesignSection';
import {
  CatalogFilterLayout,
  type CatalogFilterGroup,
} from '@/components/catalog/CatalogFilterLayout';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { useCatalogPagination } from '@/hooks/useCatalogPagination';
import { resolveProductDesignDisplayName } from '@/lib/products/design-display-name';
import { Reveal } from '@/components/motion/Reveal';
import { ArrowLeft } from 'lucide-react';

type ProductDesignsPageProps = {
  productId: string;
  category?: ProductDesignCategory | 'all';
};

const COLLECTION_LABELS: Record<string, { en: string; mk: string }> = {
  basketball: { en: 'Basketball', mk: 'Кошарка' },
  anime: { en: 'Japanese Anime', mk: 'Јапонско аниме' },
  typography: { en: 'Streetwear Typography', mk: 'Стритвер типографија' },
  streetwear: { en: 'Streetwear', mk: 'Стритвер' },
  'baby-milestones': { en: 'Baby milestones', mk: 'Беби пресвртници' },
  'couple-packs': { en: 'Couple packs', mk: 'Парски пакети' },
  'trending-mk': { en: 'Trending MK', mk: 'Тренд МК' },
  'chemistry-drama': { en: 'Chemistry Drama', mk: 'Кемија драма' },
  'stranger-80s': { en: 'Stranger 80s', mk: 'Странџер 80-ти' },
  'peaky-era': { en: 'Peaky Era', mk: 'Пики ера' },
  'zombie-survival': { en: 'Zombie Survival', mk: 'Зомби преживување' },
  'cartel-crime': { en: 'Cartel Crime', mk: 'Картел криминал' },
  'biker-rebel': { en: 'Biker Rebel', mk: 'Бајкер бунтовник' },
  'neon-retro': { en: 'Neon Retro', mk: 'Неон ретро' },
  'vintage-dapper': { en: 'Vintage Dapper', mk: 'Винтиџ стил' },
  'science-core': { en: 'Science Core', mk: 'Наука' },
  'wild-outdoors': { en: 'Wild Outdoors', mk: 'Авантура надвор' },
  'daily-grind': { en: 'Daily Grind', mk: 'Дневен ритам' },
  'mk-slang': { en: 'MK Slang', mk: 'МК сленг' },
  'mk-retro-plates': { en: 'MK Retro Plates', mk: 'МК ретро таблици' },
  'mk-mugs': { en: 'MK Mugs', mk: 'МК шолји' },
  'mk-folk': { en: 'MK Folk', mk: 'МК фолклор' },
  family: { en: 'Family', mk: 'Семејство' },
  'kids-birthday': { en: 'Kids & birthday', mk: 'Деца и роденден' },
  'local-mk': { en: 'Local designs', mk: 'Локални дизајни' },
  'caps-local': { en: 'Caps', mk: 'Капи' },
  'bags-local': { en: 'Bags', mk: 'Торби' },
  drinkware: { en: 'Drinkware', mk: 'Шолји' },
  'family-gifts': { en: 'Family gifts', mk: 'Семејни подароци' },
};

function designMatchesSearch(
  design: ProductDesignTemplate,
  query: string,
  locale: 'mk' | 'en',
  translateName: (key: string) => string,
): boolean {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return true;

  const name = resolveProductDesignDisplayName(design, locale, translateName);
  const haystack = [
    design.id,
    design.nameKey,
    design.titleEn,
    design.titleMk,
    design.collection,
    name,
    design.textStyle?.text,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(trimmed);
}

export function ProductDesignsPage({
  productId,
  category = 'all',
}: ProductDesignsPageProps) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');
  const tc = useTranslations('products.catalog');
  const ts = useTranslations('search');
  const locale = useLocale() as 'mk' | 'en';

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [productId],
  );

  const allDesigns = useMemo(() => {
    if (!product) return [];
    const designs =
      category === 'all'
        ? getProductDesignTemplates(product)
        : getProductDesignTemplatesByCategory(product, category);

    const fit = getProductGarmentFit(product);
    if (!fit) return designs;
    return designs.filter(
      (design) =>
        !design.productTypes.includes('t-shirt') ||
        designSupportsGarmentFit(design, fit),
    );
  }, [product, category]);

  const [colorFilter, setColorFilter] = useState<string | 'all'>('all');
  const [collectionFilter, setCollectionFilter] = useState<string | 'all'>(
    'all',
  );
  const [searchQuery, setSearchQuery] = useState('');

  const availableColors = useMemo(() => {
    if (!product) return [];
    const colors = new Set<string>();
    for (const design of allDesigns) {
      for (const color of getDesignApplicableColors(design, product)) {
        colors.add(color);
      }
    }
    return [...colors];
  }, [allDesigns, product]);

  const availableCollections = useMemo(() => {
    const collections = new Set<string>();
    for (const design of allDesigns) {
      if (design.collection) collections.add(design.collection);
    }
    return [...collections].sort();
  }, [allDesigns]);

  const filteredDesigns = useMemo(() => {
    if (!product) return [];

    return allDesigns.filter((design) => {
      if (collectionFilter !== 'all' && design.collection !== collectionFilter) {
        return false;
      }

      if (colorFilter !== 'all') {
        const applicable = getDesignApplicableColors(design, product);
        const matchesColor = applicable.some(
          (color) => normalizeHex(color) === normalizeHex(colorFilter),
        );
        if (!matchesColor) return false;
      }

      if (
        !designMatchesSearch(design, searchQuery, locale, (key) => t(key))
      ) {
        return false;
      }

      return true;
    });
  }, [
    allDesigns,
    collectionFilter,
    colorFilter,
    locale,
    product,
    searchQuery,
    t,
  ]);

  const filterSignature = useMemo(
    () =>
      [colorFilter, collectionFilter, searchQuery.trim()].join('|'),
    [collectionFilter, colorFilter, searchQuery],
  );

  const { page, setPage, resetPage, paginate } = useCatalogPagination({
    totalItems: filteredDesigns.length,
  });

  const prevFilterSignature = useRef(filterSignature);
  useEffect(() => {
    if (prevFilterSignature.current === filterSignature) return;
    prevFilterSignature.current = filterSignature;
    resetPage();
  }, [filterSignature, resetPage]);

  const visibleDesigns = useMemo(
    () => paginate(filteredDesigns),
    [filteredDesigns, paginate],
  );

  const filterGroups = useMemo((): CatalogFilterGroup[] => {
    const groups: CatalogFilterGroup[] = [];

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

    if (availableCollections.length > 0) {
      groups.push({
        kind: 'pills',
        id: 'collection',
        title: tc('filterCollection'),
        options: [
          { value: 'all' as const, label: tc('allCollections') },
          ...availableCollections.map((collection) => ({
            value: collection,
            label:
              COLLECTION_LABELS[collection]?.[locale] ??
              collection.replace(/-/g, ' '),
          })),
        ],
        value: collectionFilter,
        onChange: setCollectionFilter,
      });
    }

    return groups;
  }, [
    availableCollections,
    availableColors,
    collectionFilter,
    colorFilter,
    locale,
    tc,
  ]);

  if (!product) {
    return <p>{td('notFound')}</p>;
  }

  const paths = getProductPaths(product.id, product.type);
  const isPhoto = category === 'image-designs';
  const isText = category === 'text-designs';
  const sectionTitle = isPhoto
    ? td('imageDesigns')
    : isText
      ? td('textDesigns')
      : td('premadeDesigns');
  const sectionHint = isPhoto
    ? td('imageDesignsPageHint')
    : isText
      ? td('textDesignsPageHint')
      : td('premadeDesignsPageHint');
  const sectionId =
    category === 'all'
      ? 'premade-designs'
      : isPhoto
        ? 'photo-designs'
        : 'text-designs';

  return (
    <div className="space-y-8">
      <Link
        href={paths.detail}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {td('backToProduct')}
      </Link>

      <Reveal>
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-600">{tp(product.type)}</p>
          <h1 className="mt-1 text-3xl font-bold text-ink-900">{sectionTitle}</h1>
          <p className="mt-2 text-ink-600">{sectionHint}</p>
          <p className="mt-2 text-brand-600">
            {t('startingFrom')}{' '}
            {formatPrice(getProductDisplayPrice(product), locale)}
          </p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <CatalogFilterLayout
          groups={filterGroups}
          ariaLabel={t('filterLabel')}
          showFiltersLabel={t('showFilters')}
          hideFiltersLabel={t('hideFilters')}
          resultsCount={filteredDesigns.length}
          resultsLabel={(count) => tc('resultsDesigns', { count })}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('searchPlaceholder')}
          searchAriaLabel={t('searchAriaLabel')}
          searchClearLabel={ts('clear')}
        >
          {filteredDesigns.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-12 text-center text-sm text-ink-500">
              {tc('noDesigns')}
            </p>
          ) : (
            <>
              <ProductDesignSection
                id={sectionId}
                product={product}
                designs={visibleDesigns}
                showHeader={false}
                colorFilter={colorFilter}
              />
              <CatalogPagination
                page={page}
                totalItems={filteredDesigns.length}
                onPageChange={setPage}
                previousLabel={tc('paginationPrevious')}
                nextLabel={tc('paginationNext')}
                pageLabel={(current, total) =>
                  tc('paginationPage', { current, total })
                }
              />
            </>
          )}
        </CatalogFilterLayout>
      </Reveal>
    </div>
  );
}
