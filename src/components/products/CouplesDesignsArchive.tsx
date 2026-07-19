'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Heart } from 'lucide-react';
import { CouplePackCard } from '@/components/products/CouplePackCard';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { ArchiveBackLink } from '@/components/products/ArchiveBackLink';
import {
  CatalogGridLayout,
  getCatalogWideItemClassName,
  useOptionalCatalogGrid,
} from '@/components/catalog/CatalogGrid';
import { Reveal } from '@/components/motion/Reveal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  filterCouplesPacksBySearchQuery,
  getCouplesPackTemplates,
} from '@/lib/products/couples-designs';
import {
  partnerDesignToTemplate,
  type CouplePackTemplate,
} from '@/lib/data/couple-pack';
import { products, type ProductDesignTemplate } from '@/lib/data/catalog';
import { resolveDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import { normalizeHex } from '@/lib/products/design-overlay';
import { useMergedProductDesignTemplate } from '@/lib/products/use-merged-product-design-template';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { cn } from '@/lib/utils';

type CouplesDesignsArchiveProps = {
  initialPacks?: CouplePackTemplate[];
  /** Server-merged partner templates keyed by designId. */
  initialDesigns?: Record<string, ProductDesignTemplate>;
};

const heroPreviewFrameClass =
  'rounded-none border-0 bg-transparent shadow-none';

function CouplesPackGridItems({
  packs,
  initialDesigns,
  reducedMotion,
}: {
  packs: CouplePackTemplate[];
  initialDesigns?: Record<string, ProductDesignTemplate>;
  reducedMotion: boolean;
}) {
  const grid = useOptionalCatalogGrid();
  const spanClass = getCatalogWideItemClassName(grid);

  return (
    <>
      {packs.map((pack, index) => (
        <Reveal
          key={pack.id}
          className={spanClass}
          delay={reducedMotion ? 0 : Math.min(index * 45, 360)}
          y={18}
          duration={520}
        >
          <div
            className={cn(
              'h-full transition duration-300',
              !reducedMotion && 'hover:-translate-y-1',
            )}
          >
            <CouplePackCard
              pack={pack}
              colorFilter="all"
              initialDesigns={initialDesigns}
              spanGridColumns={false}
            />
          </div>
        </Reveal>
      ))}
    </>
  );
}

function CouplesHeroPackPreview({
  pack,
  initialDesigns,
  className,
  showTitle = false,
}: {
  pack: CouplePackTemplate;
  initialDesigns?: Record<string, ProductDesignTemplate>;
  className?: string;
  showTitle?: boolean;
}) {
  const locale = useLocale();
  const [partner1, partner2] = pack.partnerDesigns;
  const staticDesign1 = partnerDesignToTemplate(pack, partner1);
  const staticDesign2 = partnerDesignToTemplate(pack, partner2);
  const design1 =
    useMergedProductDesignTemplate(
      partner1.designId,
      initialDesigns?.[partner1.designId] ?? staticDesign1,
    ) ?? staticDesign1;
  const design2 =
    useMergedProductDesignTemplate(
      partner2.designId,
      initialDesigns?.[partner2.designId] ?? staticDesign2,
    ) ?? staticDesign2;

  const product = useMemo(
    () =>
      products.find((item) => pack.productTypes.includes(item.type)) ??
      products.find((item) => item.id === 'tshirt-basic-white')!,
    [pack.productTypes],
  );

  // Prefer charcoal/ink in the hero so tees read against the warm gradient.
  // Widen applicableColors for preview only — merged admin templates may omit dark.
  const productColors = product.colors ?? [];
  const heroInk =
    productColors.find((value) => normalizeHex(value) === '#1c1a1d') ??
    productColors.find((value) => normalizeHex(value) === '#272d37') ??
    productColors[0];
  const heroDesign1 = {
    ...design1,
    applicableColors: productColors,
    recommendedColor: heroInk ?? design1.recommendedColor,
  };
  const heroDesign2 = {
    ...design2,
    applicableColors: productColors,
    recommendedColor: heroInk ?? design2.recommendedColor,
  };
  const previewColor = resolveDesignPreviewColor(
    heroDesign1,
    product,
    heroInk,
  );
  const title = locale === 'mk' ? pack.titleMk : pack.titleEn;

  return (
    <div className={cn('min-w-0', className)}>
      <div className="grid grid-cols-2 items-end gap-1 sm:gap-2">
        <DesignTemplatePreview
          product={product}
          color={previewColor}
          design={heroDesign1}
          typeLabel={partner1.labelEn}
          className={heroPreviewFrameClass}
        />
        <DesignTemplatePreview
          product={product}
          color={previewColor}
          design={heroDesign2}
          typeLabel={partner2.labelEn}
          className={heroPreviewFrameClass}
        />
      </div>
      {showTitle ? (
        <p className="mt-2 text-center text-xs font-medium text-rose-800/80 sm:text-sm">
          {title}
        </p>
      ) : null}
    </div>
  );
}

function CouplesHeroVisual({
  packs,
  initialDesigns,
  reducedMotion,
}: {
  packs: CouplePackTemplate[];
  initialDesigns?: Record<string, ProductDesignTemplate>;
  reducedMotion: boolean;
}) {
  const featured = packs[0];
  if (!featured) return null;

  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-lg lg:max-w-xl"
    >
      <div
        className={cn(
          'relative rounded-[1.75rem] bg-gradient-to-b from-white/90 via-rose-50/80 to-orange-50/70 px-3 py-4 shadow-[0_20px_50px_rgba(190,24,93,0.1)] ring-1 ring-rose-100/70 sm:px-5 sm:py-5',
          !reducedMotion && 'animate-float',
        )}
      >
        <CouplesHeroPackPreview
          pack={featured}
          initialDesigns={initialDesigns}
          showTitle
        />
      </div>
    </div>
  );
}

export function CouplesDesignsArchive({
  initialPacks,
  initialDesigns,
}: CouplesDesignsArchiveProps) {
  const t = useTranslations('products.couplesArchive');
  const ts = useTranslations('search');
  const tp = useTranslations('products');
  const reducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');

  const allPacks = useMemo(
    () => getCouplesPackTemplates(initialPacks),
    [initialPacks],
  );

  const filtered = useMemo(
    () => filterCouplesPacksBySearchQuery(allPacks, searchQuery),
    [allPacks, searchQuery],
  );

  return (
    <div className="w-full min-w-0">
      <section
        className="relative overflow-hidden border-b border-rose-200/70"
        style={{
          background:
            'linear-gradient(160deg, #fff1f2 0%, #fff7ed 48%, #fdf2f8 100%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(circle at 14% 30%, rgba(251, 113, 133, 0.22) 0 9px, transparent 10px), radial-gradient(circle at 82% 18%, rgba(251, 146, 60, 0.2) 0 11px, transparent 12px), radial-gradient(circle at 70% 72%, rgba(244, 63, 94, 0.16) 0 8px, transparent 9px), radial-gradient(circle at 28% 78%, rgba(253, 186, 116, 0.22) 0 10px, transparent 11px), radial-gradient(circle at 52% 12%, rgba(251, 113, 133, 0.14) 0 6px, transparent 7px)',
          }}
        />

        <HeartDecor reducedMotion={reducedMotion} />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8">
          <ArchiveBackLink
            fallbackHref={PRODUCT_OFFERING_PATHS.readyDesigns}
            label={t('back')}
          />

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
            <div className="max-w-xl">
              <p
                className="inline-flex items-center gap-2 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-rose-800 shadow-sm"
                style={{ borderRadius: '999px' }}
              >
                <Heart className="h-3.5 w-3.5" aria-hidden />
                {t('eyebrow')}
              </p>
              <h1
                className="mt-4 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl"
                style={{ letterSpacing: '-0.03em' }}
              >
                {t('title')}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-700 sm:text-lg">
                {t('subtitle')}
              </p>

              <div className="mt-6">
                <a
                  href="#couples-designs-grid"
                  className="inline-flex items-center gap-2 bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lift-brand transition hover:-translate-y-0.5 hover:bg-brand-700"
                  style={{ borderRadius: '999px' }}
                >
                  {t('ctaBrowse')}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <CouplesHeroVisual
              packs={allPacks}
              initialDesigns={initialDesigns}
              reducedMotion={reducedMotion}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div
          id="couples-designs-grid"
          className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('gridTitle')}
            </h2>
            <p className="mt-1 text-sm text-ink-600 sm:text-base">
              {t('resultsCount', { count: filtered.length })}
            </p>
          </div>

          <label className="block w-full sm:max-w-xs">
            <span className="sr-only">{tp('searchAriaLabel')}</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={tp('searchAriaLabel')}
              className="w-full border border-rose-200 bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              style={{ borderRadius: '1rem' }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-1 text-xs font-medium text-brand-700 hover:underline"
              >
                {ts('clear')}
              </button>
            ) : null}
          </label>
        </div>

        {filtered.length === 0 ? (
          <p
            className="border border-dashed border-rose-200 bg-rose-50/60 px-4 py-12 text-center text-sm text-ink-500"
            style={{ borderRadius: '1.25rem' }}
          >
            {t('noDesigns')}
          </p>
        ) : (
          <CatalogGridLayout>
            <CouplesPackGridItems
              packs={filtered}
              initialDesigns={initialDesigns}
              reducedMotion={reducedMotion}
            />
          </CatalogGridLayout>
        )}

        <p className="mt-10 text-center text-sm text-ink-500">
          {t('footerHint')}{' '}
          <Link
            href={PRODUCT_OFFERING_PATHS.readyDesigns}
            className="font-semibold text-brand-700 hover:underline"
          >
            {t('footerLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}

function HeartDecor({ reducedMotion }: { reducedMotion: boolean }) {
  const hearts = [
    { left: '10%', top: '20%', color: '#fb7185', delay: '0s', size: 18 },
    { left: '78%', top: '14%', color: '#fdba74', delay: '0.5s', size: 14 },
    { left: '88%', top: '52%', color: '#f43f5e', delay: '0.9s', size: 16 },
    { left: '16%', top: '64%', color: '#fb923c', delay: '1.2s', size: 12 },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {hearts.map((heart) => (
        <Heart
          key={`${heart.left}-${heart.top}`}
          className={cn(!reducedMotion && 'animate-float')}
          fill={heart.color}
          stroke="none"
          style={{
            position: 'absolute',
            left: heart.left,
            top: heart.top,
            width: heart.size,
            height: heart.size,
            opacity: 0.45,
            animationDelay: reducedMotion ? undefined : heart.delay,
          }}
        />
      ))}
    </div>
  );
}
