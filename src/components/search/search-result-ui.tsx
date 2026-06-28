'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowRight,
  Cake,
  Heart,
  IdCard,
  ImageIcon,
  LayoutTemplate,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import type { DesignCategory } from '@/lib/data/catalog';
import type { GlobalSearchResult } from '@/lib/catalog/catalog-search';
import {
  designCategories,
  getProductDesignTemplate,
  isImageDesignTemplate,
  products,
} from '@/lib/data/catalog';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { resolveDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import { getProductTypeIcon } from '@/lib/products/product-type-icons';
import { cn } from '@/lib/utils';

type CollectionGroup = {
  category: DesignCategory;
  categoryResult: GlobalSearchResult | null;
  subfilters: GlobalSearchResult[];
};

const designCategoryVisual: Record<
  DesignCategory,
  {
    icon: LucideIcon;
    stripe: string;
    badge: string;
    iconWrap: string;
    iconColor: string;
  }
> = {
  wedding: {
    icon: Heart,
    stripe: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-800 ring-rose-100',
    iconWrap: 'bg-rose-100',
    iconColor: 'text-rose-700',
  },
  birthday: {
    icon: Cake,
    stripe: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-900 ring-amber-100',
    iconWrap: 'bg-amber-100',
    iconColor: 'text-amber-800',
  },
  'business-cards': {
    icon: IdCard,
    stripe: 'bg-slate-500',
    badge: 'bg-slate-100 text-slate-800 ring-slate-200',
    iconWrap: 'bg-slate-100',
    iconColor: 'text-slate-700',
  },
  menus: {
    icon: UtensilsCrossed,
    stripe: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
    iconWrap: 'bg-emerald-100',
    iconColor: 'text-emerald-800',
  },
  general: {
    icon: LayoutTemplate,
    stripe: 'bg-brand-500',
    badge: 'bg-brand-50 text-brand-800 ring-brand-100',
    iconWrap: 'bg-brand-100',
    iconColor: 'text-brand-700',
  },
};

export function groupCollectionResults(
  items: GlobalSearchResult[],
): CollectionGroup[] {
  const byCategory = new Map<DesignCategory, CollectionGroup>();

  for (const item of items) {
    if (!item.designCategory) continue;

    let group = byCategory.get(item.designCategory);
    if (!group) {
      group = {
        category: item.designCategory,
        categoryResult: null,
        subfilters: [],
      };
      byCategory.set(item.designCategory, group);
    }

    if (item.collectionScope === 'category') {
      group.categoryResult = item;
    } else if (item.collectionScope === 'subfilter') {
      group.subfilters.push(item);
    }
  }

  return designCategories
    .filter((category) => byCategory.has(category))
    .map((category) => byCategory.get(category)!);
}

function CategoryBadge({
  category,
  label,
}: {
  category: DesignCategory;
  label: string;
}) {
  const visual = designCategoryVisual[category];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        visual.badge,
      )}
    >
      {label}
    </span>
  );
}

function ResultThumb({
  image,
  alt,
  icon: Icon,
  iconClassName,
  wrapClassName,
  compact = false,
}: {
  image?: string;
  alt: string;
  icon?: LucideIcon;
  iconClassName?: string;
  wrapClassName?: string;
  compact?: boolean;
}) {
  const size = compact ? 'h-10 w-10' : 'h-16 w-16';

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-white',
        size,
        wrapClassName,
      )}
    >
      {image ? (
        <Image
          src={image}
          alt={alt}
          fill
          sizes={compact ? '40px' : '64px'}
          className="object-contain p-1"
        />
      ) : Icon ? (
        <div className="flex h-full w-full items-center justify-center">
          <Icon className={cn('h-5 w-5', iconClassName)} aria-hidden />
        </div>
      ) : null}
    </div>
  );
}

const SEARCH_PREVIEW_RENDER_SIZE = 256;

function SearchProductDesignThumb({
  item,
  compact = false,
}: {
  item: GlobalSearchResult;
  compact?: boolean;
}) {
  const tp = useTranslations('products.types');
  const outer = compact ? 40 : 64;
  const scale = outer / SEARCH_PREVIEW_RENDER_SIZE;

  if (!item.productId || !item.premadeDesignId) {
    return (
      <ResultThumb
        image={item.image}
        alt={item.title}
        icon={ImageIcon}
        iconClassName="text-violet-700"
        wrapClassName="bg-violet-50"
        compact={compact}
      />
    );
  }

  const product = products.find((entry) => entry.id === item.productId);
  const design = getProductDesignTemplate(item.premadeDesignId);

  if (!product || !design) {
    return (
      <ResultThumb
        image={item.image}
        alt={item.title}
        icon={ImageIcon}
        iconClassName="text-violet-700"
        wrapClassName="bg-violet-50"
        compact={compact}
      />
    );
  }

  if (isImageDesignTemplate(design) && design.image) {
    return (
      <ResultThumb image={design.image} alt={item.title} compact={compact} />
    );
  }

  const previewColor = resolveDesignPreviewColor(design, product);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-white',
        compact ? 'h-10 w-10' : 'h-16 w-16',
      )}
    >
      <div
        className="origin-top-left"
        style={{
          width: SEARCH_PREVIEW_RENDER_SIZE,
          transform: `scale(${scale})`,
        }}
      >
        <DesignTemplatePreview
          product={product}
          color={previewColor}
          design={design}
          typeLabel={tp(product.type)}
        />
      </div>
    </div>
  );
}

export function SearchCollectionsSection({
  items,
  compact = false,
  onSelect,
}: {
  items: GlobalSearchResult[];
  compact?: boolean;
  onSelect?: () => void;
}) {
  const t = useTranslations('search');
  const tDesigns = useTranslations('designs.categories');
  const groups = groupCollectionResults(items);

  if (groups.length === 0) return null;

  return (
    <section className={compact ? 'space-y-3' : 'space-y-4'}>
      {!compact ? (
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-ink-900">
            {t('sectionCollections')}
          </h2>
          <p className="text-sm text-ink-500">{t('collectionsHint')}</p>
        </div>
      ) : (
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          {t('sectionCollections')}
        </p>
      )}

      <div className={compact ? 'space-y-2' : 'space-y-3'}>
        {groups.map((group) => {
          const visual = designCategoryVisual[group.category];
          const CategoryIcon = visual.icon;

          return (
            <div
              key={group.category}
              className={cn(
                'overflow-hidden rounded-xl border border-ink-200 bg-white',
                !compact && 'shadow-sm',
              )}
            >
              <div className="flex items-stretch">
                <div
                  className={cn('w-1 shrink-0', visual.stripe)}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        visual.iconWrap,
                      )}
                    >
                      <CategoryIcon
                        className={cn('h-5 w-5', visual.iconColor)}
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                        {tDesigns(group.category)}
                      </p>
                      {group.categoryResult ? (
                        <Link
                          href={group.categoryResult.href}
                          onClick={onSelect}
                          className="group mt-1 flex items-center gap-2 text-base font-semibold text-ink-900 transition hover:text-brand-700"
                        >
                          <span className="truncate">
                            {group.categoryResult.title}
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  {group.subfilters.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-ink-100 pt-3">
                      {group.subfilters.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={onSelect}
                          className={cn(
                            'rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800',
                          )}
                        >
                          {item.title}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SearchDesignsSection({
  items,
  compact = false,
  onSelect,
}: {
  items: GlobalSearchResult[];
  compact?: boolean;
  onSelect?: () => void;
}) {
  const t = useTranslations('search');

  if (items.length === 0) return null;

  return (
    <section className={compact ? 'space-y-2' : 'space-y-4'}>
      {compact ? (
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          {t('sectionDesigns')}
        </p>
      ) : (
        <h2 className="text-xl font-bold text-ink-900">{t('sectionDesigns')}</h2>
      )}

      <ul className={compact ? 'space-y-1' : 'grid gap-2 sm:grid-cols-2'}>
        {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onSelect}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-2.5 transition hover:border-brand-300 hover:shadow-sm',
                  compact && 'border-transparent px-2 py-2 hover:border-transparent hover:bg-brand-50',
                )}
              >
                <ResultThumb
                  image={item.image}
                  alt={item.title}
                  compact={compact}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                    {item.title}
                  </p>
                  {item.designCategory ? (
                    <div className="mt-1">
                      <CategoryBadge
                        category={item.designCategory}
                        label={item.subtitle}
                      />
                    </div>
                  ) : (
                    <p className="mt-0.5 truncate text-xs text-ink-500">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                {!compact ? (
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:text-brand-600" />
                ) : null}
              </Link>
            </li>
        ))}
      </ul>
    </section>
  );
}

export function SearchProductsSection({
  items,
  compact = false,
  onSelect,
}: {
  items: GlobalSearchResult[];
  compact?: boolean;
  onSelect?: () => void;
}) {
  const t = useTranslations('search');

  if (items.length === 0) return null;

  return (
    <section className={compact ? 'space-y-2' : 'space-y-4'}>
      {compact ? (
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          {t('sectionProducts')}
        </p>
      ) : (
        <h2 className="text-xl font-bold text-ink-900">{t('sectionProducts')}</h2>
      )}

      <ul className={compact ? 'space-y-1' : 'grid gap-2 sm:grid-cols-2'}>
        {items.map((item) => {
          const ProductIcon = item.productType
            ? getProductTypeIcon(item.productType)
            : Sparkles;

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onSelect}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-2.5 transition hover:border-sky-300 hover:shadow-sm',
                  compact && 'border-transparent px-2 py-2 hover:border-transparent hover:bg-sky-50',
                )}
              >
                <ResultThumb
                  image={item.image}
                  alt={item.title}
                  icon={ProductIcon}
                  iconClassName="text-sky-700"
                  wrapClassName="bg-sky-50"
                  compact={compact}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-sky-800">
                    {item.title}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800 ring-1 ring-inset ring-sky-100">
                    {item.subtitle}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SearchProductDesignsSection({
  items,
  compact = false,
  onSelect,
}: {
  items: GlobalSearchResult[];
  compact?: boolean;
  onSelect?: () => void;
}) {
  const t = useTranslations('search');
  const isReady = (item: GlobalSearchResult) =>
    item.productDesignCategory === 'image-designs';

  if (items.length === 0) return null;

  return (
    <section className={compact ? 'space-y-2' : 'space-y-4'}>
      {compact ? (
        <p className="px-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          {t('sectionProductDesigns')}
        </p>
      ) : (
        <h2 className="text-xl font-bold text-ink-900">
          {t('sectionProductDesigns')}
        </h2>
      )}

      <ul className={compact ? 'space-y-1' : 'grid gap-2 sm:grid-cols-2'}>
        {items.map((item) => {
          const ready = isReady(item);

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onSelect}
                className={cn(
                  'group flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-2.5 transition hover:shadow-sm',
                  ready
                    ? 'hover:border-violet-300'
                    : 'hover:border-indigo-300',
                  compact &&
                    'border-transparent px-2 py-2 hover:border-transparent',
                  compact && ready && 'hover:bg-violet-50',
                  compact && !ready && 'hover:bg-indigo-50',
                )}
              >
                <SearchProductDesignThumb item={item} compact={compact} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                    {item.title}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
                        ready
                          ? 'bg-violet-50 text-violet-800 ring-violet-100'
                          : 'bg-indigo-50 text-indigo-800 ring-indigo-100',
                      )}
                    >
                      {ready ? t('badgeReadyDesign') : t('badgeTextTemplate')}
                    </span>
                    {item.productType ? (
                      <span className="inline-flex items-center gap-1 truncate text-xs font-medium text-ink-600">
                        {(() => {
                          const ProductIcon = getProductTypeIcon(item.productType);
                          return (
                            <ProductIcon
                              className="h-3 w-3 shrink-0 text-ink-400"
                              aria-hidden
                            />
                          );
                        })()}
                        {item.subtitle}
                      </span>
                    ) : (
                      <span className="truncate text-xs text-ink-500">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
