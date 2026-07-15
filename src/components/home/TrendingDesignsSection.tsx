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
}: {
  design: TrendingProductDesign;
  name: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden shadow-[0_20px_60px_-24px_rgba(0,0,0,0.65)]',
        'transition duration-500 group-hover:scale-[1.03] group-hover:shadow-[0_28px_70px_-20px_rgba(0,0,0,0.55)]',
        design.ring,
      )}
    >
      <div className="relative aspect-square w-full bg-white">
        <Image
          src={getTrendingDesignThumbnail(design.id)}
          alt={name}
          fill
          sizes={
            featured
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
  name,
  customizeLabel,
}: {
  design: TrendingProductDesign;
  rank: number;
  featured?: boolean;
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
        featured ? 'min-h-[320px] lg:min-h-full' : 'min-h-[240px]',
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
          'pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl',
          design.badge.replace('/90', '/25'),
        )}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 border border-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white',
              design.badge,
            )}
          >
            #{rank}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
            T-shirt
          </span>
        </div>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-white/40 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
          aria-hidden
        />
      </div>

      <div
        className={cn(
          'relative mx-auto flex w-full flex-1 items-center justify-center px-4 pb-2',
          featured ? 'max-w-[92%]' : 'max-w-[88%]',
        )}
      >
        <TrendingThumbnail design={design} name={name} featured={featured} />
      </div>

      <div className="relative border-t border-white/10 p-4 sm:p-5">
        <h3
          className={cn(
            'font-semibold text-white group-hover:text-brand-100',
            featured ? 'text-lg sm:text-xl' : 'text-sm sm:text-base',
          )}
        >
          {name}
        </h3>
        <p className="mt-1.5 text-xs font-medium text-brand-200/90 sm:text-sm">
          {customizeLabel} →
        </p>
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

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow-on-dark mb-3 inline-flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-400" aria-hidden />
              {t('eyebrow')}
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              <span className="bg-gradient-to-r from-white via-brand-100 to-brand-300 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-100/80 sm:text-lg">
              {t('subtitle')}
            </p>
          </div>

          <Link
            href="/products/ready-designs?type=t-shirt"
            className="inline-flex shrink-0 items-center gap-2 border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10"
          >
            <Sparkles className="h-4 w-4 text-brand-300" aria-hidden />
            {t('viewAll')}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:gap-5">
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

        <div className="mt-10 flex justify-center sm:mt-12">
          <Link
            href="/products/ready-designs?type=t-shirt"
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
