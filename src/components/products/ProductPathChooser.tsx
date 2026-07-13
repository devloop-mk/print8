'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight, ImageIcon, Palette } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { getProductPaths } from '@/lib/products/paths';
import type { ProductOffering } from '@/lib/products/offering';
import { cn } from '@/lib/utils';

type ProductPathChooserProps = {
  productId: string;
  productType: string;
  offering: ProductOffering;
  color?: string;
  size?: string;
  /** Tighter single-column layout for the product detail sidebar */
  variant?: 'default' | 'sidebar';
};

const primaryCta =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-700';
const secondaryCta =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-800 transition hover:border-brand-300 hover:bg-brand-50';

export function ProductPathChooser({
  productId,
  productType,
  offering,
  color,
  size,
  variant = 'default',
}: ProductPathChooserProps) {
  const t = useTranslations('products.paths');
  const paths = getProductPaths(productId, productType, { color, size });

  const pathOptions = [
    {
      id: 'custom',
      icon: Palette,
      title: t('customTitle'),
      description: t('customDesc'),
      badge: t('badgeCustom'),
      cta: t('customCta'),
      meta: undefined,
      href: paths.custom,
      show: true,
      featured: !offering.hasPremade,
      primary: true,
    },
    {
      id: 'premade',
      icon: ImageIcon,
      title: t('premadeTitle'),
      description: t('premadeDesc'),
      badge: t('badgePremade'),
      cta: t('premadeCta'),
      meta: t('countPremade', { count: offering.premadeCount }),
      href: paths.premadeDesigns,
      show: offering.hasPremade,
      featured: offering.hasPremade,
      primary: false,
    },
  ].filter((path) => path.show);

  const isSidebar = variant === 'sidebar';

  return (
    <Reveal
      className={cn(
        'overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-lift',
        isSidebar ? 'flex h-full flex-col' : 'shadow-sm',
      )}
    >
      <div
        className={cn(
          'border-b border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-white',
          isSidebar ? 'px-4 py-4 lg:px-5' : 'px-5 py-5 sm:px-6',
        )}
      >
        <p className="eyebrow mb-3">{t('eyebrow')}</p>
        <h2
          className={cn(
            'font-bold text-ink-900',
            isSidebar ? 'text-xl leading-tight' : 'text-xl sm:text-2xl',
          )}
        >
          {t('title')}
        </h2>
        <p
          className={cn(
            'mt-2 leading-relaxed text-ink-500',
            isSidebar ? 'text-sm' : 'text-sm sm:text-base',
          )}
        >
          {t('subtitle')}
        </p>
      </div>

      <div
        className={cn(
          'grid gap-2',
          isSidebar ? 'flex-1 p-3 lg:p-4' : 'gap-3 p-4 sm:p-5',
          !isSidebar &&
            (pathOptions.length === 1
              ? 'max-w-md'
              : pathOptions.length === 2
                ? 'sm:grid-cols-2'
                : 'lg:grid-cols-3'),
        )}
      >
        {pathOptions.map((path, index) => {
          const Icon = path.icon;

          if (isSidebar) {
            return (
              <Link
                key={path.id}
                href={path.href}
                className="group block text-left"
              >
                <div
                  className={cn(
                    'flex gap-3 rounded-xl border p-3 transition',
                    path.primary
                      ? 'border-brand-300 bg-brand-50/40 group-hover:border-brand-400 group-hover:bg-brand-50'
                      : 'border-ink-200 bg-ink-50/40 group-hover:border-brand-200 group-hover:bg-white',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      path.primary ? 'bg-brand-600 text-white' : 'bg-white text-brand-600',
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-ink-900">{path.title}</h3>
                      {path.meta ? (
                        <span className="text-xs font-medium text-brand-600">
                          {path.meta}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-600">
                      {path.description}
                    </p>
                    <span
                      className={cn(
                        'mt-3 inline-flex items-center gap-1.5 text-sm font-semibold',
                        path.primary
                          ? 'text-brand-700 group-hover:text-brand-800'
                          : 'text-ink-700 group-hover:text-brand-700',
                      )}
                    >
                      {path.cta}
                      <ArrowRight
                        className="h-4 w-4 transition group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </span>
                  </div>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={path.id}
              href={path.href}
              className="group block h-full text-left"
            >
              <div
                className={cn(
                  'flex h-full flex-col rounded-xl border bg-white p-4 transition group-hover:border-brand-200 group-hover:shadow-md',
                  path.featured
                    ? 'border-brand-200 ring-1 ring-brand-100'
                    : 'border-ink-200',
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                    <Icon className="h-5 w-5 text-brand-600" aria-hidden />
                  </div>
                  <span className="badge-brand">{path.badge}</span>
                </div>
                <h3 className="font-semibold text-ink-900">{path.title}</h3>
                {path.meta ? (
                  <p className="mt-1 text-xs font-medium text-brand-600">
                    {path.meta}
                  </p>
                ) : null}
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                  {path.description}
                </p>
                <div className="mt-4">
                  <span className={path.primary ? primaryCta : secondaryCta}>
                    {path.cta}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Reveal>
  );
}
