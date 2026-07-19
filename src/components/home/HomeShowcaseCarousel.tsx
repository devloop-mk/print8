'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ShowcaseSlide = {
  id: string;
  href: string;
  image: string;
  imageFit?: 'cover' | 'contain';
  tint: string;
};

const slides: ShowcaseSlide[] = [
  {
    id: 'merch',
    href: '/products/category/apparel',
    image: '/hero/hero-custom-apparel-v2.png',
    tint: 'from-brand-900/55',
  },
  {
    id: 'mugs',
    href: '/products/category/drinkware',
    image: '/hero/hero-drinkware-v4.png',
    tint: 'from-sky-900/50',
  },
  {
    id: 'photoDesigns',
    href: '/products/ready-designs',
    image: '/hero/hero-photo-designs-v4.png',
    tint: 'from-ink-900/55',
  },
  {
    id: 'readyDesigns',
    href: '/designs',
    image: '/hero/hero-ready-designs-v4.png',
    tint: 'from-ink-900/60',
  },
  {
    id: 'gifts',
    href: '/products/category/gifts',
    image: '/magnets/magnet-ceramic-heart.jpg',
    imageFit: 'contain',
    tint: 'from-rose-900/45',
  },
  {
    id: 'printing',
    href: '/services#print',
    image: '/NEW_DESIGNS/business-cards/pack-100/bcard-100-046.jpg',
    tint: 'from-brand-900/50',
  },
  {
    id: 'textTemplates',
    href: '/products/text-templates',
    image: '/hero/hero-your-brand-v5.png',
    tint: 'from-emerald-900/50',
  },
];

export function HomeShowcaseCarousel() {
  const t = useTranslations('home.showcase');
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: 'prev' | 'next') {
    const container = scrollRef.current;
    if (!container) return;

    const card = container.querySelector<HTMLElement>('[data-showcase-card]');
    const gap = 16;
    const amount = (card?.offsetWidth ?? 280) + gap;
    container.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: 'smooth',
    });
  }

  return (
    <section className="border-b border-ink-200/80 bg-white py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
          <div className="max-w-2xl">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h2 className="mt-3 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {t('title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600 sm:text-base">
              {t('subtitle')}
            </p>
          </div>

          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCard('prev')}
              className="inline-flex h-11 w-11 items-center justify-center border-2 border-ink-300 bg-white text-ink-700 shadow-lift transition hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700"
              aria-label={t('scrollPrev')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard('next')}
              className="inline-flex h-11 w-11 items-center justify-center border-2 border-ink-300 bg-white text-ink-700 shadow-lift transition hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-700"
              aria-label={t('scrollNext')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className={cn(
            'flex gap-4 overflow-x-auto pb-1',
            'snap-x snap-mandatory scroll-smooth',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {slides.map((slide) => (
            <Link
              key={slide.id}
              href={slide.href}
              data-showcase-card
              aria-label={t(`slides.${slide.id}.title`)}
              className="group w-[78vw] shrink-0 snap-start sm:w-[280px] lg:w-[300px]"
            >
              <article className="surface-panel flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift-brand">
                <div
                  className={cn(
                    'relative aspect-[4/3] overflow-hidden',
                    slide.imageFit === 'contain' ? 'bg-ink-50' : 'bg-ink-100',
                  )}
                >
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 78vw, 300px"
                    className={cn(
                      'transition duration-500 group-hover:scale-105',
                      slide.imageFit === 'contain'
                        ? 'object-contain p-6'
                        : 'object-cover',
                    )}
                  />
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t to-transparent',
                      slide.tint,
                    )}
                    aria-hidden
                  />
                  <span className="absolute bottom-3 left-3 border border-white/30 bg-ink-950/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                    {t(`slides.${slide.id}.badge`)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="font-display text-base font-bold text-ink-900 transition group-hover:text-brand-700 sm:text-lg">
                    {t(`slides.${slide.id}.title`)}
                  </h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">
                    {t(`slides.${slide.id}.description`)}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 transition group-hover:gap-2.5 group-hover:text-brand-700">
                    {t('explore')}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
