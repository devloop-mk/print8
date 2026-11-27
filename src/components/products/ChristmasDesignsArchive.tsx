'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Snowflake } from 'lucide-react';
import { ProductDesignCatalogCard } from '@/components/products/ProductDesignCatalogCard';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { ArchiveBackLink } from '@/components/products/ArchiveBackLink';
import { CatalogGridLayout } from '@/components/catalog/CatalogGrid';
import { Reveal } from '@/components/motion/Reveal';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  resolveDesignProduct,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import { groupChristmasCatalogEntries } from '@/lib/products/christmas-designs';
import { getProductDesignDisplayName } from '@/lib/products/design-display-name';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { cn } from '@/lib/utils';

const heroPreviewFrameClass =
  'rounded-none border-0 bg-transparent shadow-none';

function ChristmasHeroBodysuit({
  entry,
}: {
  entry: ProductDesignCatalogEntry;
}) {
  const locale = useLocale() as 'mk' | 'en';
  const { product } = resolveDesignProduct(entry, 'all');
  const name = getProductDesignDisplayName(entry.design, locale);

  return (
    <DesignTemplatePreview
      product={product}
      color="#ffffff"
      design={entry.design}
      typeLabel={name}
      className={heroPreviewFrameClass}
      allowDrinkware3d={false}
    />
  );
}

export function ChristmasDesignsArchive({
  entries,
}: {
  entries: ProductDesignCatalogEntry[];
}) {
  const t = useTranslations('products.christmasArchive');
  const types = useTranslations('products.typesPlural');
  const reducedMotion = useReducedMotion();
  const groups = groupChristmasCatalogEntries(entries);
  const featured = [
    entries.find((entry) => entry.design.productTypes[0] === 'bodysuit'),
    entries.find((entry) => entry.design.productTypes[0] === 'hoodie'),
    entries.find((entry) => entry.design.productTypes[0] === 'mug'),
  ].filter((entry): entry is ProductDesignCatalogEntry => entry != null);

  return (
    <div className="w-full min-w-0">
      <section
        className="relative overflow-hidden border-b border-[#1a4a34]"
        style={{
          background:
            'linear-gradient(165deg, #10281c 0%, #1a3d2b 48%, #4a1e24 100%)',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 24%, rgba(255,255,255,0.5) 0 1.5px, transparent 2px), radial-gradient(circle at 80% 18%, rgba(255,255,255,0.4) 0 1px, transparent 1.6px), radial-gradient(circle at 64% 70%, rgba(255,255,255,0.35) 0 1.5px, transparent 2px), radial-gradient(circle at 28% 78%, rgba(232,196,114,0.16) 0 70px, transparent 71px)',
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 text-white sm:px-6 sm:pb-14 sm:pt-10 lg:px-8">
          <ArchiveBackLink
            fallbackHref={PRODUCT_OFFERING_PATHS.readyDesigns}
            label={t('back')}
            className="text-white/80 hover:text-white"
          />

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#f3d48a]">
                <Snowflake className="h-3.5 w-3.5" aria-hidden />
                {t('eyebrow')}
              </p>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                {t('title')}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                {t('subtitle')}
              </p>
            </div>

            {featured.length > 0 ? (
              <div className="grid grid-cols-3 items-end gap-1 sm:gap-2">
                {featured.map((entry, index) => (
                  <div
                    key={entry.design.id}
                    className={cn(
                      'overflow-hidden rounded-2xl bg-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.65)]',
                      index === 1 && '-translate-y-2',
                    )}
                  >
                    <ChristmasHeroBodysuit entry={entry} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
            {t('gridTitle')}
          </h2>
          <p className="mt-1 text-sm text-ink-600 sm:text-base">
            {t('resultsCount', { count: entries.length })}
          </p>
        </div>

        <CatalogGridLayout defaultMobileColumns={1}>
          {groups.map((group, groupIndex) => (
            <div key={group.type} className="contents">
              <h3
                className={cn(
                  'col-span-full font-display text-xl font-bold text-ink-900',
                  groupIndex > 0 && 'mt-8',
                )}
              >
                {types(group.type)}
              </h3>
              {group.entries.map((entry, index) => (
                <Reveal
                  key={entry.design.id}
                  delay={reducedMotion ? 0 : Math.min(index * 40, 280)}
                  y={18}
                  duration={520}
                >
                  <div className="h-full">
                    <ProductDesignCatalogCard
                      entry={entry}
                      colorFilter="all"
                      preferredProductId={entry.products[0]?.id}
                      preferredProductType={group.type}
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          ))}
        </CatalogGridLayout>

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
