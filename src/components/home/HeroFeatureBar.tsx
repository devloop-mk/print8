'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Award,
  Palette,
  Printer,
  Sparkles,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  productCategoryHref,
  productNavCategories,
} from '@/lib/products/product-nav';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';

/** Serializable icon keys for server → client props (never pass Lucide components). */
export type HeroFeatureIconId =
  | 'sparkles'
  | 'printer'
  | 'award'
  | 'truck'
  | 'palette';

const HERO_FEATURE_ICONS: Record<HeroFeatureIconId, LucideIcon> = {
  sparkles: Sparkles,
  printer: Printer,
  award: Award,
  truck: Truck,
  palette: Palette,
};

type StripItem = {
  id: string;
  href?: string;
  icon: LucideIcon;
  label: string;
};

export function HeroFeatureBar({
  items: customItems,
}: {
  /** Optional override (e.g. services page). Defaults to product category strip. */
  items?: Array<{ icon: HeroFeatureIconId; label: string }>;
} = {}) {
  const t = useTranslations('home.categoryStrip');

  const items: StripItem[] = customItems
    ? customItems.map((item, index) => ({
        id: `custom-${index}`,
        icon: HERO_FEATURE_ICONS[item.icon],
        label: item.label,
      }))
    : [
        ...productNavCategories.map((category) => ({
          id: category.id,
          href: productCategoryHref(category.id),
          icon: category.icon,
          label: t(`items.${category.id}`),
        })),
        {
          id: 'ready',
          href: PRODUCT_OFFERING_PATHS.readyDesigns,
          icon: Sparkles,
          label: t('items.ready'),
        },
        {
          id: 'custom',
          href: PRODUCT_OFFERING_PATHS.custom,
          icon: Palette,
          label: t('items.custom'),
        },
      ];

  return (
    <div className="relative w-full border-t border-ink-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-3.5 lg:px-8">
        {!customItems ? (
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-500 sm:mb-2.5">
            {t('label')}
          </p>
        ) : null}
        <div
          className={cn(
            'flex gap-2 overflow-x-auto pb-0.5',
            'snap-x snap-mandatory scroll-smooth',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
        >
          {items.map(({ id, href, icon: Icon, label }) => {
            const className = cn(
              'group flex shrink-0 snap-start items-center gap-2 border border-ink-200 bg-ink-50/80 px-3 py-2',
              'text-sm font-semibold text-ink-800 transition',
              href &&
                'hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-800',
            );

            const content = (
              <>
                <Icon
                  className="h-4 w-4 shrink-0 text-brand-600 transition group-hover:text-brand-700"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="whitespace-nowrap">{label}</span>
              </>
            );

            if (href) {
              return (
                <Link key={id} href={href} className={className}>
                  {content}
                </Link>
              );
            }

            return (
              <div key={id} className={className}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
