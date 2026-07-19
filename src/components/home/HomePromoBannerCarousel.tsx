'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { promoBannerSlides } from '@/lib/home/promo-banner-slides';

const AUTO_ADVANCE_MS = 6500;

function SlideCopy({
  slideId,
  href,
  active,
  className,
}: {
  slideId: string;
  href: string;
  active: boolean;
  className?: string;
}) {
  const t = useTranslations('home.promoBanners');

  return (
    <div className={className}>
      <h2 className="font-display text-[1.55rem] font-bold leading-[1.12] tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.55rem] xl:text-5xl">
        {t(`slides.${slideId}.title`)}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/88 sm:mt-3 sm:text-base md:text-lg">
        {t(`slides.${slideId}.subtitle`)}
      </p>
      <Link
        href={href}
        tabIndex={active ? 0 : -1}
        className={cn(
          'mt-4 inline-flex min-h-11 items-center justify-center border-2 border-[#e85d04] bg-[#e85d04] px-5 py-2.5',
          'text-sm font-semibold uppercase tracking-wide text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.25)]',
          'transition hover:-translate-y-0.5 hover:border-[#f48c06] hover:bg-[#f48c06] active:translate-y-0 active:shadow-none',
          'sm:mt-6 sm:min-h-0 sm:px-6 sm:py-3',
        )}
      >
        {t(`slides.${slideId}.cta`)}
      </Link>
    </div>
  );
}

export function HomePromoBannerCarousel({ className = '' }: { className?: string }) {
  const t = useTranslations('home.promoBanners');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = promoBannerSlides.length;
  const activeSlide = promoBannerSlides[index] ?? promoBannerSlides[0];

  const goTo = useCallback(
    (nextIndex: number) => {
      setIndex(((nextIndex % total) + total) % total);
    },
    [total],
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [paused, index, total]);

  const renderPagination = () => (
    <div className="flex items-center justify-center gap-2" role="tablist" aria-label={t('ariaLabel')}>
      {promoBannerSlides.map((slide, slideIndex) => (
        <button
          key={slide.id}
          type="button"
          role="tab"
          aria-selected={slideIndex === index}
          aria-label={t('goToSlide', {
            title: t(`slides.${slide.id}.title`),
          })}
          onClick={() => goTo(slideIndex)}
          className={cn(
            'h-1.5 transition-all duration-300',
            slideIndex === index ? 'w-7 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70',
          )}
        />
      ))}
    </div>
  );

  return (
    <div
      className={cn('relative w-full overflow-hidden bg-ink-950', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      {/*
        Mobile: CSS grid 1fr / auto — image row consumes all leftover height
        above the content-sized copy band (~75dvh total). No empty ink strip.
        Desktop: 16/9 frame with a right-anchored 3:2 media plane (banner native
        ratio) so products aren't side-cropped; copy sits in the left ink area.
      */}
      <div
        className={cn(
          'relative w-full overflow-hidden',
          'grid h-[75dvh] max-h-[680px] min-h-[520px] grid-rows-[minmax(0,1fr)_auto]',
          'sm:block sm:h-auto sm:max-h-none sm:min-h-0',
        )}
        role="region"
        aria-roledescription="carousel"
        aria-label={t('ariaLabel')}
      >
        <div
          className={cn(
            'relative min-h-0 w-full overflow-hidden bg-ink-950',
            /* Desktop banners are native 3:2 — keep a roomy frame; media plane matches that ratio. */
            'sm:aspect-[16/9] sm:max-h-[min(68vh,720px)]',
          )}
        >
          {promoBannerSlides.map((slide, slideIndex) => {
            const active = slideIndex === index;
            return (
              <div
                key={slide.id}
                className={cn(
                  'absolute inset-0 transition-opacity duration-700 ease-out',
                  active ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none',
                )}
                aria-hidden={!active}
              >
                {/*
                  Desktop: right-anchored 3:2 plane (matches banner assets) so apparel
                  isn't side-cropped inside a wider hero; left ink is copy space.
                  Mobile: unchanged cover fill for the ~75dvh composition.
                */}
                <div className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-auto max-w-full aspect-[3/2] sm:block">
                  <Image
                    src={slide.imageDesktop}
                    alt={t(`slides.${slide.id}.title`)}
                    fill
                    priority={slideIndex === 0}
                    sizes="(min-width: 640px) 70vw, 100vw"
                    className="object-cover object-center"
                  />
                </div>
                <Image
                  src={slide.imageMobile}
                  alt={t(`slides.${slide.id}.title`)}
                  fill
                  priority={slideIndex === 0}
                  sizes="100vw"
                  className="object-cover object-[center_40%] sm:hidden"
                  style={{ objectFit: 'cover' }}
                />

                {/* Desktop readability wash — ink over copy side into the photo seam */}
                <div
                  className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-ink-950 from-[20%] via-ink-950/80 via-[42%] to-transparent to-[62%] sm:block"
                  aria-hidden
                />
                {/* Mobile edge wash for top controls only — keep bottom edge photo-flush */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-ink-950/40 to-transparent sm:hidden"
                  aria-hidden
                />

                <div className="absolute inset-0 hidden items-center sm:flex">
                  <div className="relative z-10 mx-auto w-full max-w-6xl px-10 md:px-14 lg:px-16">
                    <SlideCopy
                      slideId={slide.id}
                      href={slide.href}
                      active={active}
                      className="max-w-lg md:max-w-xl"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 border border-white/25 bg-ink-950/55 p-2 text-white backdrop-blur-sm transition hover:bg-ink-950/80 sm:left-4 sm:p-2.5"
            aria-label={t('prev')}
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 border border-white/25 bg-ink-950/55 p-2 text-white backdrop-blur-sm transition hover:bg-ink-950/80 sm:right-4 sm:p-2.5"
            aria-label={t('next')}
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Desktop dots — over the image */}
          <div className="absolute bottom-4 left-1/2 z-20 hidden -translate-x-1/2 sm:block">
            {renderPagination()}
          </div>
        </div>

        {/* Mobile copy band — content-sized, flush under the photo */}
        <div className="relative z-10 border-t border-white/10 bg-ink-950 px-5 pb-4 pt-3 sm:hidden">
          <div className="mb-3">{renderPagination()}</div>
          <SlideCopy slideId={activeSlide.id} href={activeSlide.href} active />
        </div>
      </div>
    </div>
  );
}
