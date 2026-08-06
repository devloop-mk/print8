'use client';

import { useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DesignCardThumbnail } from '@/components/designs/DesignCardThumbnail';
import { getDesignHref } from '@/lib/data/catalog';
import type { GalleryDesignTemplate } from '@/lib/catalog/slim-design-template';
import { getDesignThumbAspect } from '@/lib/designs/design-thumb';
import { cn } from '@/lib/utils';

/** Keep in sync with homepage server slice — only this many enter the ISR payload. */
export const MAX_FEATURED_DESIGNS = 3;

type FeaturedDesign = GalleryDesignTemplate;

function getFeaturedDesignName(
  design: FeaturedDesign,
  locale: string,
  fallback: (id: string) => string,
) {
  if (design.nameEn || design.nameMk) {
    return locale === 'mk'
      ? (design.nameMk ?? design.nameEn ?? design.id)
      : (design.nameEn ?? design.nameMk ?? design.id);
  }
  return fallback(design.id);
}

function FeaturedDesignCard({
  design,
  compact,
  locale,
  t,
}: {
  design: FeaturedDesign;
  compact?: boolean;
  locale: string;
  t: ReturnType<typeof useTranslations<'designs'>>;
}) {
  const isFixed = design.kind === 'fixed';
  const displayName = getFeaturedDesignName(design, locale, (id) =>
    t(`templates.${id}`),
  );

  return (
    <Link
      href={getDesignHref(design)}
      prefetch={false}
      className="group block h-full"
      data-featured-design-card
    >
      <article
        className={cn(
          'flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-sm',
          'transition duration-300 hover:border-brand-300 hover:shadow-md',
        )}
      >
        <div
          className={cn(
            'relative overflow-hidden bg-ink-50',
            compact && 'aspect-[4/5]',
          )}
          style={
            compact ? undefined : { aspectRatio: getDesignThumbAspect(design) }
          }
        >
          <DesignCardThumbnail design={design} alt={displayName} fill />
          {!isFixed ? (
            <span className="badge-brand absolute left-3 top-3 bg-white/95 shadow-sm">
              {t('customizableBadge')}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
            {t(`categories.${design.category}`)}
          </p>
          <p
            className={cn(
              'mt-1.5 font-semibold text-ink-900 transition group-hover:text-brand-700',
              compact ? 'text-sm leading-snug' : 'text-base',
            )}
          >
            {displayName}
          </p>
          <p className="mt-auto pt-2.5 text-sm font-semibold text-brand-600 sm:pt-3">
            {isFixed ? t('orderWithInfo') : t('customizeOnline')}
            <span
              aria-hidden
              className="ml-1 inline-block transition group-hover:translate-x-0.5"
            >
              →
            </span>
          </p>
        </div>
      </article>
    </Link>
  );
}

export function FeaturedDesignCards({ designs }: { designs: FeaturedDesign[] }) {
  const t = useTranslations('designs');
  const th = useTranslations('home');
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);

  const visible = designs.slice(0, MAX_FEATURED_DESIGNS);

  function scrollByCard(direction: 'prev' | 'next') {
    const container = scrollRef.current;
    if (!container) return;

    const card = container.querySelector<HTMLElement>('[data-featured-design-card]');
    const gap = 12;
    const amount = (card?.offsetWidth ?? 280) + gap;
    container.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: 'smooth',
    });
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-300 bg-ink-50 px-4 py-10 text-center text-sm text-ink-500">
          {th('noDesignsInCategory')}
        </p>
      ) : (
        <>
          {/* Mobile: compact horizontal carousel (portrait thumbs are too tall full-width). */}
          <div className="sm:hidden">
            <div className="mb-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => scrollByCard('prev')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink-300 bg-white text-ink-700 shadow-sm transition hover:border-brand-500 hover:text-brand-700"
                aria-label={th('showcase.scrollPrev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard('next')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink-300 bg-white text-ink-700 shadow-sm transition hover:border-brand-500 hover:text-brand-700"
                aria-label={th('showcase.scrollNext')}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div
              ref={scrollRef}
              className={cn(
                'flex gap-3 overflow-x-auto pb-1',
                'snap-x snap-mandatory scroll-smooth',
                '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              )}
            >
              {visible.map((design) => (
                <div
                  key={design.id}
                  className="w-[min(72vw,280px)] shrink-0 snap-start"
                >
                  <FeaturedDesignCard
                    design={design}
                    compact
                    locale={locale}
                    t={t}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Tablet / desktop: grid with natural thumb aspect. */}
          <div className="hidden gap-5 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {visible.map((design) => (
              <FeaturedDesignCard
                key={design.id}
                design={design}
                locale={locale}
                t={t}
              />
            ))}
          </div>

          <div className="flex justify-center pt-1">
            <Link
              href="/designs"
              className="text-sm font-semibold text-brand-700 transition hover:text-brand-800"
            >
              {th('viewAllDesigns')}
              <span aria-hidden className="ml-1">
                →
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
