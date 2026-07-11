'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { heroCarouselSlides } from '@/lib/home/hero-carousel-slides';

const AUTO_ADVANCE_MS = 5500;

export function HeroCarousel({ className = '' }: { className?: string }) {
  const t = useTranslations('home.heroCarousel');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((nextIndex: number) => {
    const total = heroCarouselSlides.length;
    setIndex(((nextIndex % total) + total) % total);
  }, []);

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % heroCarouselSlides.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [paused, index]);

  return (
    <div
      className={cn('relative w-full', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 shadow-2xl shadow-black/30 backdrop-blur-sm">
        <div className="relative aspect-[3/4] w-full lg:aspect-[5/6]">
          {heroCarouselSlides.map((item, slideIndex) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'absolute inset-0 block transition-opacity duration-700 ease-out',
                slideIndex === index ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none',
              )}
              aria-hidden={slideIndex !== index}
              tabIndex={slideIndex === index ? 0 : -1}
            >
              <Image
                src={item.image}
                alt={t(`slides.${item.id}.title`)}
                fill
                sizes="(max-width: 1024px) 100vw, 512px"
                className={cn(
                  item.imageFit === 'contain' ? 'object-contain' : 'object-cover',
                )}
                priority={slideIndex === 0}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/92 via-black/60 via-[38%] to-transparent px-5 pb-5 pt-20 sm:px-6 sm:pb-6 sm:pt-24">
                <p className="text-base font-bold leading-snug text-white sm:text-lg">
                  {t(`slides.${item.id}.title`)}
                </p>
                <p className="mt-1 text-sm font-medium text-white/80">
                  {t(`slides.${item.id}.cta`)} →
                </p>
              </div>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={goPrev}
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-ink-950/60 p-2 text-white backdrop-blur-sm transition hover:bg-ink-950/80"
          aria-label={t('prev')}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 bg-ink-950/60 p-2 text-white backdrop-blur-sm transition hover:bg-ink-950/80"
          aria-label={t('next')}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div
        className="mt-4 flex items-center justify-center gap-2"
        role="tablist"
        aria-label={t('ariaLabel')}
      >
        {heroCarouselSlides.map((item, slideIndex) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={t('goToSlide', { title: t(`slides.${item.id}.title`) })}
            onClick={() => goTo(slideIndex)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              slideIndex === index
                ? 'w-7 bg-brand-300'
                : 'w-2 bg-white/35 hover:bg-white/55',
            )}
          />
        ))}
      </div>
    </div>
  );
}
