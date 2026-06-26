'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  type ProductDesignCategory,
  type ProductSide,
  type ProductType,
} from '@/lib/data/catalog';
import { buildProductTypeFilterOptions } from '@/lib/products/product-type-icons';
import { parseProductTypeFilter } from '@/lib/data/service-routes';
import {
  filterDesignCatalogEntries,
  getCatalogColors,
  getProductDesignCatalogEntries,
} from '@/lib/products/design-catalog';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { FilterChipBar } from '@/components/catalog/FilterChipBar';
import { ProductDesignCatalogCard } from '@/components/products/ProductDesignCatalogCard';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';

type ProductDesignsCatalogProps = {
  category: ProductDesignCategory;
};

type TypeFilter = ProductType | 'all';
type SideFilter = ProductSide | 'all';

export function ProductDesignsCatalog({ category }: ProductDesignsCatalogProps) {
  const t = useTranslations('products');
  const tc = useTranslations('products.catalog');
  const searchParams = useSearchParams();

  const allEntries = useMemo(
    () => getProductDesignCatalogEntries(category),
    [category],
  );

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(() =>
    parseProductTypeFilter(searchParams.get('type')),
  );
  const [colorFilter, setColorFilter] = useState<string | 'all'>('all');
  const [sideFilter, setSideFilter] = useState<SideFilter>('all');

  const { allOption, options: typeOptions } = useMemo(
    () =>
      buildProductTypeFilterOptions((type) =>
        type === 'all' ? t('allTypes') : t(`typesPlural.${type}`),
      ),
    [t],
  );

  const availableColors = useMemo(
    () => getCatalogColors(allEntries),
    [allEntries],
  );

  const filtered = useMemo(
    () =>
      filterDesignCatalogEntries(allEntries, {
        type: typeFilter,
        color: colorFilter,
        side: sideFilter,
      }),
    [allEntries, typeFilter, colorFilter, sideFilter],
  );

  const pageTitle =
    category === 'image-designs'
      ? tc('readyDesignsTitle')
      : tc('textTemplatesTitle');
  const pageSubtitle =
    category === 'image-designs'
      ? tc('readyDesignsSubtitle')
      : tc('textTemplatesSubtitle');

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
        <h1 className="text-3xl font-bold text-ink-900">{pageTitle}</h1>
        <p className="mt-2 text-ink-600">{pageSubtitle}</p>
      </div>

      <Reveal delay={40}>
        <FilterChipBar
          ariaLabel={t('filterLabel')}
          showFiltersLabel={t('showFilters')}
          hideFiltersLabel={t('hideFilters')}
          allOption={allOption}
          options={typeOptions}
          value={typeFilter}
          onChange={setTypeFilter}
          resultsCount={filtered.length}
          resultsLabel={(count) => tc('resultsDesigns', { count })}
          mobileLayout="scroll"
        />
      </Reveal>

      <Reveal delay={60}>
        <div className="mb-8 space-y-4 rounded-2xl border border-ink-200 bg-white p-4 shadow-sm">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-900">
              {tc('filterColor')}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColorFilter('all')}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  colorFilter === 'all'
                    ? 'bg-brand-600 text-white'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                )}
              >
                {tc('allColors')}
              </button>
              {availableColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setColorFilter(color)}
                  className={cn(
                    'h-9 w-9 rounded-full border-2 transition',
                    colorFilter === color
                      ? 'border-brand-600 ring-2 ring-brand-200'
                      : 'border-ink-200 hover:border-ink-300',
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink-900">
              {tc('filterSide')}
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'all' as const, label: tc('allSides') },
                  { value: 'front' as const, label: tc('sideFront') },
                  { value: 'back' as const, label: tc('sideBack') },
                  { value: 'left' as const, label: tc('sideLeft') },
                  { value: 'right' as const, label: tc('sideRight') },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSideFilter(option.value)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    sideFilter === option.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-12 text-center text-sm text-ink-500">
          {tc('noDesigns')}
        </p>
      ) : (
        <Reveal delay={80}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <ProductDesignCatalogCard
                key={entry.design.id}
                entry={entry}
                colorFilter={colorFilter}
              />
            ))}
          </div>
        </Reveal>
      )}
    </div>
  );
}
