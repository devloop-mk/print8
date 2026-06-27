'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  designCategoryHref,
  designNavCategories,
  designNavQuickLinks,
} from '@/lib/designs/design-nav';
import { ChevronRight } from 'lucide-react';

type DesignsNavMenuProps = {
  onNavigate?: () => void;
  variant?: 'dropdown' | 'mobile';
};

export function DesignsNavMenu({
  onNavigate,
  variant = 'dropdown',
}: DesignsNavMenuProps) {
  const t = useTranslations('nav.designsMenu');
  const td = useTranslations('designs');
  const isMobile = variant === 'mobile';

  return (
    <div
      className={cn(
        isMobile ? 'space-y-4' : 'grid gap-6 p-1 sm:grid-cols-2 lg:gap-8',
      )}
    >
      <div>
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          {t('browseByCategory')}
        </p>
        <ul className={cn('mt-3 space-y-1', isMobile && 'space-y-0.5')}>
          {designNavCategories.map((category) => {
            const CategoryIcon = category.icon;

            return (
              <li key={category.id}>
                <Link
                  href={designCategoryHref(category.id)}
                  onClick={onNavigate}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-lg transition hover:bg-brand-50',
                    isMobile ? 'px-2.5 py-2.5' : 'px-3 py-2.5',
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-50 text-ink-600 transition group-hover:bg-white group-hover:text-brand-600">
                    <CategoryIcon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-ink-800 group-hover:text-brand-700">
                    {td(`categories.${category.id}`)}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-brand-600">
          {t('createAndOrder')}
        </p>
        <ul className="mt-3 space-y-1">
          {designNavQuickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.id}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className="group flex items-start gap-3 rounded-xl px-2 py-2.5 transition hover:bg-brand-50 sm:px-3"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-white">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                      {t(`links.${link.labelKey}`)}
                      <ChevronRight
                        className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                        aria-hidden
                      />
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-ink-500">
                      {t(`links.${link.descriptionKey}`)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
