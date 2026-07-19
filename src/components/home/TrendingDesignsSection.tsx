'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Flame, Sparkles, ArrowUpRight } from 'lucide-react';
import type { TrendingProductDesign } from '@/lib/cms/home-trending';
import { resolveProductDesignDisplayName } from '@/lib/products/design-display-name';
import { buildDesignDetailUrl } from '@/lib/products/paths';
import { getTrendingDesignThumbnail } from '@/lib/home/trending-thumbnail';
import { cn } from '@/lib/utils';

function TrendingThumbnail({
  design,
  name,
  featured = false,
  compact = false,
}: {
  design: TrendingProductDesign;
  name: string;
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden shadow-[0_20px_60px_-24px_rgba(0,0,0,0.65)]',
        'transition duration-500 group-hover:scale-[1.03] group-hover:shadow-[0_28px_70px_-20px_rgba(0,0,0,0.55)]',
        compact && 'shadow-[0_8px_24px_-12px_rgba(0,0,0,0.5)] group-hover:shadow-[0_12px_28px_-10px_rgba(0,0,0,0.45)]',
        design.ring,
      )}
    >
      <div
        className={cn(
          'relative w-full bg-white',
          compact ? 'aspect-[5/6]' : 'aspect-square',
        )}
      >
        <Image
          src={getTrendingDesignThumbnail(design.id)}
          alt={name}
          fill
          sizes={
            compact
              ? '55vw'
              : featured
                ? '(max-width: 1024px) 100vw, 50vw'
                : '(max-width: 768px) 50vw, 25vw'
          }
          className="object-contain"
          loading="lazy"
        />
      </div>
    </div>
  );
}

function TrendingCard({
  design,
  rank,
  featured = false,
  compact = false,
  name,
  customizeLabel,
}: {
  design: TrendingProductDesign;
  rank: number;
  featured?: boolean;
  compact?: boolean;
  name: string;
  customizeLabel: string;
}) {
  const href = buildDesignDetailUrl(design.id);

  return (
    <Link
      href={href}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden',
        'border border-white/10 bg-white/[0.04] backdrop-blur-sm',
        'transition duration-500 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.07]',
        'hover:shadow-[0_24px_80px_-20px_rgba(255,255,255,0.15)]',
        compact && 'w-[55vw] max-w-[210px] shrink-0 snap-start',
        featured && !compact && 'min-h-[320px] lg:min-h-full',
        !featured && !compact && 'min-h-[240px]',
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80',
          design.gradient,
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-8 rounded-full blur-3xl',
          compact ? 'h-20 w-20' : 'h-32 w-32',
          design.badge.replace('/90', '/25'),
        )}
        aria-hidden
      />

      <div
        className={cn(
          'relative flex items-start justify-between gap-2',
          compact ? 'p-2.5' : 'gap-3 p-4 sm:p-5',
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 border border-white/20 font-bold uppercase tracking-wider text-white',
              compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
              design.badge,
            )}
          >
            #{rank}
          </span>
          {!compact ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              T-shirt
            </span>
          ) : null}
        </div>
        <ArrowUpRight
          className={cn(
            'shrink-0 text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white',
            compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
          )}
          aria-hidden
        />
      </div>

      <div
        className={cn(
          'relative mx-auto flex w-full flex-1 items-center justify-center',
          compact ? 'max-w-[88%] px-2 pb-1' : 'max-w-[88%] px-4 pb-2',
          featured && !compact && 'max-w-[92%]',
        )}
      >
        <TrendingThumbnail
          design={design}
          name={name}
          featured={featured}
          compact={compact}
        />
      </div>

      <div
        className={cn(
          'relative border-t border-white/10',
          compact ? 'p-2.5' : 'p-4 sm:p-5',
        )}
      >
        <h3
          className={cn(
            'font-semibold text-white group-hover:text-brand-100',
            compact
              ? 'line-clamp-2 text-xs leading-snug'
              : featured
                ? 'text-lg sm:text-xl'
                : 'text-sm sm:text-base',
          )}
        >
          {name}
        </h3>
        {!compact ? (
          <p className="mt-1.5 text-xs font-medium text-brand-200/90 sm:text-sm">
            {customizeLabel} →
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function TrendingDesignsSection({
  designs,
}: {
  designs: TrendingProductDesign[];
}) {
  const t = useTranslations('home.trending');
  const tp = useTranslations('products');
  const locale = useLocale() as 'mk' | 'en';

  if (designs.length === 0) return null;

  const [hero, ...rest] = designs;

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-ink-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.22),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mb-5 flex flex-col gap-4 sm:mb-10 sm:gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow-on-dark mb-2 inline-flex items-center gap-2 sm:mb-3">
              <Flame className="h-4 w-4 text-orange-400" aria-hidden />
              {t('eyebrow')}
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              <span className="bg-gradient-to-r from-white via-brand-100 to-brand-300 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-100/80 sm:mt-4 sm:text-base lg:text-lg">
              {t('subtitle')}
            </p>
          </div>

          <Link
            href="/products/ready-designs"
            className="inline-flex shrink-0 items-center gap-2 border border-white/25 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10 sm:px-5 sm:py-2.5"
          >
            <Sparkles className="h-4 w-4 text-brand-300" aria-hidden />
            {t('viewAll')}
          </Link>
        </div>

        {/* Mobile: compact horizontal scroll instead of one giant #1 card */}
        <div
          className={cn(
            'overflow-x-auto pb-1 sm:hidden',
            'snap-x snap-mandatory scroll-pl-4',
            '-mx-4',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
          aria-label={t('title')}
        >
          <div className="flex w-max gap-3 px-4">
            {designs.map((design, index) => (
              <TrendingCard
                key={design.id}
                design={design}
                rank={index + 1}
                compact
                name={resolveProductDesignDisplayName(design, locale, (key) => tp(key))}
                customizeLabel={tp('customize')}
              />
            ))}
          </div>
        </div>

        {/* Tablet/desktop: bento grid with featured #1 hero */}
        <div className="hidden grid-cols-2 gap-4 sm:grid lg:grid-cols-4 lg:grid-rows-2 lg:gap-5">
          {hero ? (
            <div className="sm:col-span-2 lg:col-span-2 lg:row-span-2">
              <TrendingCard
                design={hero}
                rank={1}
                featured
                name={resolveProductDesignDisplayName(hero, locale, (key) => tp(key))}
                customizeLabel={tp('customize')}
              />
            </div>
          ) : null}

          {rest.map((design, index) => (
            <TrendingCard
              key={design.id}
              design={design}
              rank={index + 2}
              name={resolveProductDesignDisplayName(design, locale, (key) => tp(key))}
              customizeLabel={tp('customize')}
            />
          ))}
        </div>

        <div className="mt-8 hidden justify-center sm:mt-12 sm:flex">
          <Link
            href="/products/ready-designs"
            className="inline-flex items-center gap-2 border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10"
          >
            <Sparkles className="h-4 w-4 text-brand-300" aria-hidden />
            {t('viewAll')}
            <ArrowUpRight className="h-4 w-4 text-white/50" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
