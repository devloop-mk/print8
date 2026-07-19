'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { promoBannerSlides } from '@/lib/home/promo-banner-slides';

const AUTO_ADVANCE_MS = 6500;
const PROGRAMMATIC_SCROLL_MS = 350;

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
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const ignoreScrollSyncRef = useRef(false);
  const scrollSyncTimeoutRef = useRef<number | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = promoBannerSlides.length;
  const activeSlide = promoBannerSlides[index] ?? promoBannerSlides[0];

  const beginProgrammaticScroll = useCallback(() => {
    ignoreScrollSyncRef.current = true;
    if (scrollSyncTimeoutRef.current !== null) {
      window.clearTimeout(scrollSyncTimeoutRef.current);
    }
    scrollSyncTimeoutRef.current = window.setTimeout(() => {
      ignoreScrollSyncRef.current = false;
      scrollSyncTimeoutRef.current = null;
    }, PROGRAMMATIC_SCROLL_MS);
  }, []);

  const scrollMobileTo = useCallback((nextIndex: number) => {
    const container = mobileScrollRef.current;
    if (!container || container.offsetParent === null) return;

    const clamped = ((nextIndex % total) + total) % total;
    const slide = container.querySelectorAll<HTMLElement>('[data-promo-slide]')[clamped];
    if (!slide) return;

    const targetLeft = slide.offsetLeft + (slide.offsetWidth - container.clientWidth) / 2;
    container.scrollTo({ left: targetLeft, behavior: 'smooth' });
  }, [total]);

  const goTo = useCallback(
    (nextIndex: number) => {
      const clamped = ((nextIndex % total) + total) % total;
      setIndex(clamped);
      beginProgrammaticScroll();
      scrollMobileTo(clamped);
    },
    [beginProgrammaticScroll, scrollMobileTo, total],
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const container = mobileScrollRef.current;
    if (!container) return;

    const syncIndexFromScroll = () => {
      if (window.matchMedia('(min-width: 640px)').matches) return;

      const slides = container.querySelectorAll<HTMLElement>('[data-promo-slide]');
      const center = container.scrollLeft + container.offsetWidth / 2;
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;

      slides.forEach((el, slideIndex) => {
        const slideCenter = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(slideCenter - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = slideIndex;
        }
      });

      setIndex(best);
    };

    const endProgrammaticScroll = () => {
      if (scrollSyncTimeoutRef.current !== null) {
        window.clearTimeout(scrollSyncTimeoutRef.current);
        scrollSyncTimeoutRef.current = null;
      }
      ignoreScrollSyncRef.current = false;
      syncIndexFromScroll();
    };

    const onScroll = () => {
      if (ignoreScrollSyncRef.current) return;
      syncIndexFromScroll();
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    container.addEventListener('scrollend', endProgrammaticScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      container.removeEventListener('scrollend', endProgrammaticScroll);
      if (scrollSyncTimeoutRef.current !== null) {
        window.clearTimeout(scrollSyncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      if (ignoreScrollSyncRef.current) return;
      goTo(index + 1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [paused, index, goTo]);

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

  const renderDesktopImage = (slide: (typeof promoBannerSlides)[number], slideIndex: number) => (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-auto max-w-full aspect-[3/2] sm:block">
      <Link
        href={slide.href}
        tabIndex={slideIndex === index ? 0 : -1}
        aria-label={t(`slides.${slide.id}.title`)}
        className="pointer-events-auto absolute inset-0 z-[5]"
      />
      <Image
        src={slide.imageDesktop}
        alt={t(`slides.${slide.id}.title`)}
        fill
        priority={slideIndex === 0}
        sizes="(min-width: 640px) 70vw, 100vw"
        className={cn(
          'pointer-events-none object-cover object-center',
          'sm:[mask-image:linear-gradient(to_right,transparent,black_30%)]',
          'sm:[-webkit-mask-image:linear-gradient(to_right,transparent,black_30%)]',
        )}
      />
    </div>
  );

  const renderMobileImage = (slide: (typeof promoBannerSlides)[number], slideIndex: number) => (
    <div className="absolute inset-0 overflow-hidden sm:hidden">
      <Link
        href={slide.href}
        tabIndex={slideIndex === index ? 0 : -1}
        aria-label={t(`slides.${slide.id}.title`)}
        className="absolute inset-0 z-10 block"
      />
      <Image
        src={slide.imageMobile}
        alt={t(`slides.${slide.id}.title`)}
        fill
        priority={slideIndex === 0}
        sizes="100vw"
        className={cn(
          'object-cover',
          !slide.mobileObjectPosition && 'object-[center_40%]',
          '[mask-image:linear-gradient(to_bottom,black_0%,black_52%,rgba(0,0,0,0.82)_68%,rgba(0,0,0,0.35)_82%,transparent_100%)]',
          '[-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_52%,rgba(0,0,0,0.82)_68%,rgba(0,0,0,0.35)_82%,transparent_100%)]',
        )}
        style={{
          objectFit: 'cover',
          ...(slide.mobileObjectPosition
            ? { objectPosition: slide.mobileObjectPosition }
            : {}),
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-ink-950/40 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-brand-800/55 to-brand-800"
        aria-hidden
      />
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
      {/* Desktop: 16/9 frame with right-anchored 3:2 media plane and left copy panel. */}
      <div
        className="relative hidden w-full overflow-hidden sm:block"
        role="region"
        aria-roledescription="carousel"
        aria-label={t('ariaLabel')}
      >
        <div
          className={cn(
            'relative min-h-0 w-full overflow-hidden bg-brand-800',
            'aspect-[16/9] max-h-[min(68vh,720px)]',
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
                {renderDesktopImage(slide, slideIndex)}

                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-800 from-[20%] via-brand-800/80 via-[42%] to-transparent to-[62%]"
                  aria-hidden
                />

                <div className="absolute inset-0 flex items-center">
                  <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
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
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 border border-white/25 bg-ink-950/55 p-2.5 text-white backdrop-blur-sm transition hover:bg-ink-950/80"
            aria-label={t('prev')}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 border border-white/25 bg-ink-950/55 p-2.5 text-white backdrop-blur-sm transition hover:bg-ink-950/80"
            aria-label={t('next')}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
            {renderPagination()}
          </div>
        </div>
      </div>

      {/* Mobile: horizontal image track + fixed copy/dots overlay (stable svh shell). */}
      <div
        className={cn(
          'relative sm:hidden',
          'h-[75svh] max-h-[680px] min-h-[520px]',
        )}
        role="region"
        aria-roledescription="carousel"
        aria-label={t('ariaLabel')}
      >
        <div
          ref={mobileScrollRef}
          className={cn(
            'absolute inset-0 overflow-x-auto overflow-y-hidden',
            'flex h-full snap-x snap-mandatory',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {promoBannerSlides.map((slide, slideIndex) => (
            <div
              key={slide.id}
              data-promo-slide
              className="relative h-full min-w-full shrink-0 snap-center snap-always self-stretch overflow-hidden bg-brand-800"
              aria-hidden={slideIndex !== index}
            >
              {renderMobileImage(slide, slideIndex)}
            </div>
          ))}
        </div>

        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-10',
            'bg-gradient-to-b from-brand-800 via-brand-800 to-brand-900 px-5 pb-5 pt-5',
            'before:pointer-events-none before:absolute before:inset-x-0 before:-top-14 before:h-14 before:bg-gradient-to-b before:from-transparent before:via-brand-800/45 before:to-brand-800',
          )}
        >
          <div className="pointer-events-auto">
            <SlideCopy slideId={activeSlide.id} href={activeSlide.href} active />
            <div className="mt-4">{renderPagination()}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-2 top-[38%] z-20 -translate-y-1/2 border border-white/25 bg-ink-950/55 p-2 text-white backdrop-blur-sm transition hover:bg-ink-950/80"
          aria-label={t('prev')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute right-2 top-[38%] z-20 -translate-y-1/2 border border-white/25 bg-ink-950/55 p-2 text-white backdrop-blur-sm transition hover:bg-ink-950/80"
          aria-label={t('next')}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
