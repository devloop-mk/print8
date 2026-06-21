'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Palette,
  Printer,
  Shirt,
  Sparkles,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ShowcaseSlide = {
  id: string;
  href: string;
  image: string;
  icon: typeof Shirt;
  /** Bottom fade: transparent → accent color */
  accent: string;
  badgeClass: string;
};

const slides: ShowcaseSlide[] = [
  {
    id: 'merch',
    href: '/products',
    image: '/t-shirts/tshirt-white.png',
    icon: Shirt,
    accent: 'from-brand-600/75',
    badgeClass: 'bg-brand-600/90',
  },
  {
    id: 'mugs',
    href: '/products',
    image: '/mugs/mug-milkyblue.png',
    icon: Sparkles,
    accent: 'from-sky-600/75',
    badgeClass: 'bg-sky-600/90',
  },
  {
    id: 'printing',
    href: '/services',
    image: '/designs/bc-classic.svg',
    icon: Printer,
    accent: 'from-ink-700/75',
    badgeClass: 'bg-ink-800/90',
  },
  {
    id: 'readyDesigns',
    href: '/designs',
    image: '/designs/wedding-floral.svg',
    icon: Palette,
    accent: 'from-rose-600/75',
    badgeClass: 'bg-rose-600/90',
  },
  {
    id: 'photoDesigns',
    href: '/products/ready-designs',
    image: '/product-designs/floral.svg',
    icon: ImageIcon,
    accent: 'from-violet-600/75',
    badgeClass: 'bg-violet-600/90',
  },
  {
    id: 'textTemplates',
    href: '/products/text-templates',
    image: '/bags/bag-beige.png',
    icon: Type,
    accent: 'from-emerald-600/75',
    badgeClass: 'bg-emerald-600/90',
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
    <section className="border-b border-ink-100 bg-white py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              {t('eyebrow')}
            </p>
            <h2 className="mt-1 text-xl font-bold text-ink-900 sm:text-2xl">
              {t('title')}
            </h2>
            <p className="mt-1 text-sm text-ink-500 sm:text-base">{t('subtitle')}</p>
          </div>

          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCard('prev')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 transition hover:border-brand-200 hover:text-brand-600"
              aria-label={t('scrollPrev')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard('next')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 transition hover:border-brand-200 hover:text-brand-600"
              aria-label={t('scrollNext')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className={cn(
            'flex gap-4 overflow-x-auto pb-2',
            'snap-x snap-mandatory scroll-smooth',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {slides.map((slide) => {
            const Icon = slide.icon;

            return (
              <Link
                key={slide.id}
                href={slide.href}
                data-showcase-card
                className="group w-[78vw] shrink-0 snap-start sm:w-[300px] lg:w-[320px]"
              >
                <article className="relative h-full overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-ink-50/50 to-white">
                    <Image
                      src={slide.image}
                      alt={t(`slides.${slide.id}.title`)}
                      fill
                      sizes="(max-width: 640px) 78vw, 320px"
                      className={cn(
                        'object-contain p-5 pb-10 transition duration-500 group-hover:scale-105',
                        slide.id === 'printing' ||
                          slide.id === 'readyDesigns' ||
                          slide.id === 'photoDesigns'
                          ? 'p-7 pb-11'
                          : 'p-4 pb-10',
                      )}
                    />
                    <div
                      className={cn(
                        'pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t to-transparent',
                        slide.accent,
                      )}
                      aria-hidden
                    />
                    <div className="absolute bottom-3 left-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1',
                          'text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm',
                          slide.badgeClass,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                        {t(`slides.${slide.id}.badge`)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 p-4">
                    <h3 className="font-semibold text-ink-900 group-hover:text-brand-700">
                      {t(`slides.${slide.id}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-500">
                      {t(`slides.${slide.id}.description`)}
                    </p>
                    <p className="pt-1 text-sm font-medium text-brand-600">
                      {t('explore')} →
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
