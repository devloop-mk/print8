'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { DesignCardThumbnail } from '@/components/designs/DesignCardThumbnail';
import {
  getDesignHref,
} from '@/lib/data/catalog';
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

export function FeaturedDesignCards({ designs }: { designs: FeaturedDesign[] }) {
  const t = useTranslations('designs');
  const th = useTranslations('home');
  const locale = useLocale();

  const visible = designs.slice(0, MAX_FEATURED_DESIGNS);

  return (
    <div className="space-y-6">
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-300 bg-ink-50 px-4 py-10 text-center text-sm text-ink-500">
          {th('noDesignsInCategory')}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {visible.map((design) => {
              const isFixed = design.kind === 'fixed';
              const displayName = getFeaturedDesignName(
                design,
                locale,
                (id) => t(`templates.${id}`),
              );
              return (
                <Link
                  key={design.id}
                  href={getDesignHref(design)}
                  prefetch={false}
                  className="group block h-full"
                >
                  <article
                    className={cn(
                      'flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-sm',
                      'transition duration-300 hover:border-brand-300 hover:shadow-md',
                    )}
                  >
                    <div
                      className="relative flex items-center justify-center bg-gradient-to-b from-ink-50 via-ink-50 to-white p-4 sm:p-5"
                      style={{ aspectRatio: getDesignThumbAspect(design) }}
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-ink-200/70">
                        <DesignCardThumbnail
                          design={design}
                          alt={displayName}
                        />
                      </div>
                      {!isFixed ? (
                        <span className="badge-brand absolute left-3 top-3 bg-white/95 shadow-sm">
                          {t('customizableBadge')}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col px-4 pb-4 pt-1 sm:px-5 sm:pb-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600">
                        {t(`categories.${design.category}`)}
                      </p>
                      <p className="mt-1.5 text-base font-semibold text-ink-900 transition group-hover:text-brand-700">
                        {displayName}
                      </p>
                      <p className="mt-auto pt-3 text-sm font-semibold text-brand-600">
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
            })}
          </div>

          <div className="flex justify-center pt-1">
            <Link
              href="/designs/all"
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
