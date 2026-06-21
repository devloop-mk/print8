'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  ChevronDown,
  Package,
  Palette,
  Truck,
  ImageIcon,
  Type,
} from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { cn } from '@/lib/utils';

export function ProductJourneyGuide() {
  const t = useTranslations('products.journey');
  const [howOpen, setHowOpen] = useState(false);

  const steps = [
    { icon: Package, title: t('step1Title'), description: t('step1Desc') },
    { icon: Palette, title: t('step2Title'), description: t('step2Desc') },
    { icon: Truck, title: t('step3Title'), description: t('step3Desc') },
  ];

  const ways = [
    {
      id: 'custom',
      href: PRODUCT_OFFERING_PATHS.custom,
      icon: Palette,
      title: t('wayCustomTitle'),
      description: t('wayCustomDesc'),
      badge: t('wayCustomBadge'),
      cta: t('waysCtaCustom'),
    },
    {
      id: 'photo',
      href: PRODUCT_OFFERING_PATHS.readyDesigns,
      icon: ImageIcon,
      title: t('wayPhotoTitle'),
      description: t('wayPhotoDesc'),
      badge: t('wayPhotoBadge'),
      cta: t('waysCtaReady'),
    },
    {
      id: 'template',
      href: PRODUCT_OFFERING_PATHS.textTemplates,
      icon: Type,
      title: t('wayTemplateTitle'),
      description: t('wayTemplateDesc'),
      badge: t('wayTemplateBadge'),
      cta: t('waysCtaTemplates'),
    },
  ];

  return (
    <div className="mb-8 space-y-6">
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-ink-50 shadow-sm">
          <button
            type="button"
            className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
            aria-expanded={howOpen}
            onClick={() => setHowOpen((open) => !open)}
          >
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                {t('eyebrow')}
              </p>
              <h2 className="mt-1 text-lg font-bold text-ink-900 sm:text-xl">
                {t('title')}
              </h2>
              <p className="mt-1 text-sm text-ink-600">{t('summary')}</p>
            </div>
            <ChevronDown
              className={cn(
                'mt-1 h-5 w-5 shrink-0 text-ink-400 transition-transform duration-300',
                howOpen && 'rotate-180',
              )}
              aria-hidden
            />
          </button>

          <div
            className={cn(
              'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
              howOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0',
            )}
          >
            <div className="overflow-hidden">
              <div className="border-t border-brand-100/80 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
                <p className="mb-4 max-w-2xl text-sm leading-relaxed text-ink-600">
                  {t('subtitle')}
                </p>
                <ol className="grid gap-3 sm:grid-cols-3">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <li
                        key={step.title}
                        className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <Icon className="h-4 w-4 text-brand-600" aria-hidden />
                        </div>
                        <h3 className="text-sm font-semibold text-ink-900">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-ink-600">
                          {step.description}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={40}>
        <div>
          <h3 className="text-base font-semibold text-ink-900 sm:text-lg">
            {t('waysTitle')}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-ink-600">
            {t('waysSubtitle')}
          </p>

          <div
            className={cn(
              'mt-3 flex gap-2.5 overflow-x-auto pb-1',
              'snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              'sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:pb-0',
            )}
          >
            {ways.map((way) => {
              const Icon = way.icon;
              return (
                <Link
                  key={way.id}
                  href={way.href}
                  className={cn(
                    'group block w-[72vw] max-w-[220px] shrink-0 snap-start sm:w-auto sm:max-w-none',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-full flex-col rounded-xl border border-ink-200 bg-white p-3 shadow-sm',
                      'transition hover:border-brand-200 hover:shadow-md',
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50">
                        <Icon className="h-4 w-4 text-brand-600" aria-hidden />
                      </div>
                      <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-600">
                        {way.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-ink-900 group-hover:text-brand-700">
                      {way.title}
                    </h4>
                    <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-500">
                      {way.description}
                    </p>
                    <p className="mt-2 text-xs font-medium text-brand-600">
                      {way.cta} →
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
