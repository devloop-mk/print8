'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Package, Truck, Upload, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HomeHighlights() {
  const t = useTranslations('home.highlights');

  const cards = [
    {
      id: 'upload',
      icon: Upload,
      accent: 'border-brand-400/50 bg-gradient-to-br from-brand-50 to-white',
      iconClass: 'border-brand-300 bg-brand-100 text-brand-700',
      href: '/products/custom',
    },
    {
      id: 'cargo',
      icon: Truck,
      accent: 'border-ink-300 bg-gradient-to-br from-ink-50 to-white',
      iconClass: 'border-ink-300 bg-ink-100 text-ink-700',
      href: '/contact',
    },
    {
      id: 'range',
      icon: Package,
      accent: 'border-emerald-300/60 bg-gradient-to-br from-emerald-50/80 to-white',
      iconClass: 'border-emerald-300 bg-emerald-100 text-emerald-800',
      href: '/services',
    },
  ] as const;

  return (
    <section className="border-b border-ink-200/80 bg-white py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-2xl">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h2 className="mt-2 text-xl font-bold text-ink-900 sm:text-2xl">{t('title')}</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(({ id, icon: Icon, accent, iconClass, href }) => (
            <Link
              key={id}
              href={href}
              className={cn(
                'group surface-panel flex h-full flex-col border-2 p-5 transition',
                'hover:-translate-y-0.5 hover:shadow-lift-brand',
                accent,
              )}
            >
              <div
                className={cn(
                  'mb-4 flex h-11 w-11 items-center justify-center border',
                  iconClass,
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-base font-bold text-ink-900 sm:text-lg">
                {t(`${id}.title`)}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                {t(`${id}.description`)}
              </p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
                {t(`${id}.cta`)}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
