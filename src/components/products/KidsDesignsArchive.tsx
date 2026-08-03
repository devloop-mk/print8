'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowDown, Sparkles } from 'lucide-react';
import { ProductDesignCatalogCard } from '@/components/products/ProductDesignCatalogCard';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { ArchiveBackLink } from '@/components/products/ArchiveBackLink';
import { CatalogGridLayout } from '@/components/catalog/CatalogGrid';
import { Reveal } from '@/components/motion/Reveal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  filterProductDesignEntriesBySearchQuery,
} from '@/lib/catalog/catalog-search';
import { useCatalogSearchLabels } from '@/hooks/useCatalogSearchLabels';
import {
  resolveDesignProduct,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import { pickVariedDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import { getKidsDesignCatalogEntries } from '@/lib/products/kids-designs';
import { resolveProductDesignDisplayName } from '@/lib/products/design-display-name';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { cn } from '@/lib/utils';

type KidsDesignsArchiveProps = {
  initialEntries?: ProductDesignCatalogEntry[];
};

const heroPreviewFrameClass =
  'rounded-none border-0 bg-transparent shadow-none';

function KidsHeroTee({
  entry,
  className,
}: {
  entry: ProductDesignCatalogEntry;
  className?: string;
}) {
  const t = useTranslations('products');
  const locale = useLocale() as 'mk' | 'en';
  const { product } = resolveDesignProduct(entry, 'all');
  const color = pickVariedDesignPreviewColor(entry.design, product);
  const name = resolveProductDesignDisplayName(entry.design, locale, (key) =>
    t(key),
  );

  return (
    <div className={cn('min-w-0', className)}>
      <DesignTemplatePreview
        product={product}
        color={color}
        design={entry.design}
        typeLabel={name}
        className={heroPreviewFrameClass}
      />
    </div>
  );
}

function KidsHeroVisual({
  entries,
  reducedMotion,
}: {
  entries: ProductDesignCatalogEntry[];
  reducedMotion: boolean;
}) {
  const featured = entries.slice(0, 3);
  if (featured.length === 0) return null;

  const [primary, secondary, tertiary] = featured;

  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none"
    >
      <div
        className="relative rounded-[1.75rem] bg-gradient-to-b from-white/90 via-sky-50/85 to-amber-50/75 px-2 py-3 shadow-[0_20px_50px_rgba(14,165,233,0.12)] ring-1 ring-sky-100/80 sm:px-3 sm:py-4"
      >
        <div className="grid grid-cols-3 items-end gap-0.5 sm:gap-1.5">
          {secondary ? (
            <div
              className={cn(
                'translate-y-3 sm:translate-y-4',
                !reducedMotion && 'animate-float',
              )}
              style={{ animationDelay: reducedMotion ? undefined : '0.35s' }}
            >
              <KidsHeroTee entry={secondary} />
            </div>
          ) : (
            <div />
          )}

          <div
            className={cn(
              'z-10 -translate-y-1 sm:-translate-y-2',
              !reducedMotion && 'animate-float',
            )}
          >
            <KidsHeroTee entry={primary} />
          </div>

          {tertiary ? (
            <div
              className={cn(
                'translate-y-4 sm:translate-y-5',
                !reducedMotion && 'animate-float',
              )}
              style={{ animationDelay: reducedMotion ? undefined : '0.7s' }}
            >
              <KidsHeroTee entry={tertiary} />
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  );
}

export function KidsDesignsArchive({ initialEntries }: KidsDesignsArchiveProps) {
  const t = useTranslations('products.kidsArchive');
  const ts = useTranslations('search');
  const tp = useTranslations('products');
  const searchLabels = useCatalogSearchLabels();
  const reducedMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState('');

  const allEntries = useMemo(
    () => getKidsDesignCatalogEntries(initialEntries),
    [initialEntries],
  );

  const filtered = useMemo(
    () =>
      filterProductDesignEntriesBySearchQuery(
        allEntries,
        searchQuery,
        searchLabels,
      ),
    [allEntries, searchQuery, searchLabels],
  );

  return (
    <div className="w-full min-w-0">
      <section
        className="relative overflow-hidden border-b border-sky-200/70"
        style={{
          background:
            'linear-gradient(165deg, #e8f6ff 0%, #fff7ed 42%, #ecfdf5 100%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 28%, rgba(251, 191, 36, 0.28) 0 10px, transparent 11px), radial-gradient(circle at 78% 22%, rgba(56, 189, 248, 0.3) 0 12px, transparent 13px), radial-gradient(circle at 88% 68%, rgba(244, 114, 182, 0.22) 0 9px, transparent 10px), radial-gradient(circle at 24% 78%, rgba(52, 211, 153, 0.24) 0 11px, transparent 12px), radial-gradient(circle at 52% 14%, rgba(251, 146, 60, 0.2) 0 7px, transparent 8px)',
          }}
        />

        <BalloonDecor reducedMotion={reducedMotion} />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-8">
          <ArchiveBackLink
            fallbackHref={PRODUCT_OFFERING_PATHS.readyDesigns}
            label={t('back')}
          />

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
            <div className="max-w-xl">
              <p
                className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-800 shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
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
                  href="#kids-designs-grid"
                  className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lift-brand transition hover:bg-brand-700"
                >
                  {t('ctaBrowse')}
                  <ArrowDown className="h-4 w-4" />
                </a>
              </div>
            </div>

            <KidsHeroVisual
              entries={allEntries}
              reducedMotion={reducedMotion}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div
          id="kids-designs-grid"
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
              className="w-full rounded-lg border border-sky-200 bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
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
            className="rounded-xl border border-dashed border-sky-200 bg-sky-50/60 px-4 py-12 text-center text-sm text-ink-500"
          >
            {t('noDesigns')}
          </p>
        ) : (
          <CatalogGridLayout defaultMobileColumns={1}>
            {filtered.map((entry, index) => (
              <Reveal
                key={entry.design.id}
                delay={reducedMotion ? 0 : Math.min(index * 45, 360)}
                y={18}
                duration={520}
              >
                <div
                  className={cn(
                    'h-full transition duration-300',
                  )}
                >
                  <ProductDesignCatalogCard
                    entry={entry}
                    colorFilter="all"
                    varyInitialColor
                  />
                </div>
              </Reveal>
            ))}
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

function BalloonDecor({ reducedMotion }: { reducedMotion: boolean }) {
  const balloons = [
    { left: '8%', top: '18%', color: '#38bdf8', delay: '0s', size: 28 },
    { left: '72%', top: '12%', color: '#fb923c', delay: '0.4s', size: 22 },
    { left: '86%', top: '48%', color: '#34d399', delay: '0.8s', size: 24 },
    { left: '18%', top: '62%', color: '#f472b6', delay: '1.1s', size: 18 },
  ];

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {balloons.map((balloon) => (
        <span
          key={`${balloon.left}-${balloon.top}`}
          className={cn(!reducedMotion && 'animate-float')}
          style={{
            position: 'absolute',
            left: balloon.left,
            top: balloon.top,
            width: balloon.size,
            height: balloon.size * 1.25,
            borderRadius: '50% 50% 50% 50% / 45% 45% 55% 55%',
            background: balloon.color,
            opacity: 0.55,
            animationDelay: reducedMotion ? undefined : balloon.delay,
            boxShadow: `inset -4px -6px 0 rgba(255,255,255,0.25)`,
          }}
        />
      ))}
    </div>
  );
}
