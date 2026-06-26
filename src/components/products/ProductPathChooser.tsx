'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ImageIcon, Palette, Type } from 'lucide-react';
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
  'inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700';
const secondaryCta =
  'inline-flex w-full items-center justify-center rounded-lg bg-ink-100 px-3 py-1.5 text-sm font-medium text-ink-900 transition hover:bg-ink-200';

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
      id: 'photo',
      icon: ImageIcon,
      title: t('photoTitle'),
      description: t('photoDesc'),
      badge: t('badgePhoto'),
      cta: t('photoCta'),
      meta: t('countPhoto', { count: offering.imageDesignCount }),
      href: paths.photoDesigns,
      show: offering.hasPhotoDesigns,
      featured: offering.hasPhotoDesigns,
      primary: false,
    },
    {
      id: 'template',
      icon: Type,
      title: t('templateTitle'),
      description: t('templateDesc'),
      badge: t('badgeTemplate'),
      cta: t('templateCta'),
      meta: t('countTemplate', { count: offering.textDesignCount }),
      href: paths.textDesigns,
      show: offering.hasTextTemplates,
      featured: false,
      primary: false,
    },
  ].filter((path) => path.show);

  const isSidebar = variant === 'sidebar';

  return (
    <Reveal
      className={cn(
        'rounded-2xl border border-ink-200 bg-gradient-to-br from-white to-ink-50 shadow-sm',
        isSidebar ? 'flex h-full flex-col p-4 lg:p-5' : 'p-5 sm:p-6',
      )}
    >
      <div className={cn('mb-4', isSidebar ? '' : 'mb-5 max-w-2xl')}>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          {t('eyebrow')}
        </p>
        <h2
          className={cn(
            'mt-1 font-bold text-ink-900',
            isSidebar ? 'text-lg' : 'text-xl sm:text-2xl',
          )}
        >
          {t('title')}
        </h2>
        <p
          className={cn(
            'mt-2 text-ink-600',
            isSidebar ? 'text-sm' : 'text-sm sm:text-base',
          )}
        >
          {t('subtitle')}
        </p>
      </div>

      <div
        className={cn(
          'grid gap-3',
          isSidebar
            ? 'flex-1 grid-cols-1'
            : pathOptions.length === 1
              ? 'max-w-md'
              : pathOptions.length === 2
                ? 'sm:grid-cols-2'
                : 'lg:grid-cols-3',
        )}
      >
        {pathOptions.map((path) => {
          const Icon = path.icon;

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
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-700">
                    {path.badge}
                  </span>
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
