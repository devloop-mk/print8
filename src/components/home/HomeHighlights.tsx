'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Package, ShieldCheck, Upload, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const cards = [
  {
    id: 'upload',
    icon: Upload,
    href: '/products/custom',
    accent: 'border-brand-300 bg-brand-50 text-brand-700',
  },
  {
    id: 'cod',
    icon: ShieldCheck,
    href: '/faq',
    accent: 'border-ink-300 bg-ink-100 text-ink-700',
  },
  {
    id: 'range',
    icon: Package,
    href: '/services',
    accent: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
] as const;

export function HomeHighlights() {
  const t = useTranslations('home.highlights');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const scrollTo = useCallback((next: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const clamped = ((next % cards.length) + cards.length) % cards.length;
    const card = container.querySelectorAll<HTMLElement>('[data-highlight-card]')[clamped];
    card?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setIndex(clamped);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const cardsEls = container.querySelectorAll<HTMLElement>('[data-highlight-card]');
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      cardsEls.forEach((el, i) => {
        const dist = Math.abs(el.offsetLeft - container.scrollLeft);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setIndex(best);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="border-b border-ink-200/80 bg-white py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">{t('eyebrow')}</p>
            <h2 className="mt-2 text-xl font-bold text-ink-900 sm:text-2xl">{t('title')}</h2>
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollTo(index - 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-300 bg-white text-ink-700 transition hover:border-brand-500 hover:text-brand-700"
              aria-label={t('prev')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollTo(index + 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-300 bg-white text-ink-700 transition hover:border-brand-500 hover:text-brand-700"
              aria-label={t('next')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className={cn(
            'flex gap-3 overflow-x-auto pb-1',
            'snap-x snap-mandatory scroll-smooth',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {cards.map(({ id, icon: Icon, href, accent }) => (
            <Link
              key={id}
              href={href}
              data-highlight-card
              className={cn(
                'group flex w-[84vw] shrink-0 snap-start flex-col rounded-xl border border-ink-200 bg-ink-50/40 p-4 transition',
                'hover:border-brand-300 hover:bg-white hover:shadow-lift sm:w-[min(340px,42vw)]',
              )}
            >
              <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-md border', accent)}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-base font-bold text-ink-900">{t(`${id}.title`)}</h3>
              <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-600">
                {t(`${id}.description`)}
              </p>
              <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                {t(`${id}.cta`)}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-3 flex justify-center gap-1.5 sm:hidden" role="tablist" aria-label={t('title')}>
          {cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={t(`${card.id}.title`)}
              onClick={() => scrollTo(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === index ? 'w-6 bg-brand-600' : 'w-1.5 bg-ink-300',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
