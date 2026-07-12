'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';
import {
  ArrowUpRight,
  MessageSquareText,
  Palette,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const highlights = [
  {
    icon: MessageSquareText,
    key: 'brief' as const,
    accent: 'from-sky-400/20 to-brand-500/10',
    iconBg: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
    step: '01',
  },
  {
    icon: Palette,
    key: 'craft' as const,
    accent: 'from-violet-400/20 to-fuchsia-500/10',
    iconBg: 'bg-violet-500/15 text-violet-300 ring-violet-400/30',
    step: '02',
  },
  {
    icon: Sparkles,
    key: 'deliver' as const,
    accent: 'from-amber-400/20 to-orange-500/10',
    iconBg: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
    step: '03',
  },
];

export function HomeCustomDesignCta() {
  const t = useTranslations('home.customDesign');

  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-ink-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_15%_0%,rgba(139,92,246,0.18),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_90%_100%,rgba(59,130,246,0.16),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-rose-500/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-grid-light bg-grid opacity-[0.04]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow-on-dark mb-5 inline-flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-brand-300" aria-hidden />
              {t('eyebrow')}
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
              <span className="bg-gradient-to-r from-white via-brand-100 to-violet-200 bg-clip-text text-transparent">
                {t('title')}
              </span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100/80 sm:text-lg">
              {t('subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/designs/custom">
                <Button
                  size="lg"
                  className="border-white bg-white text-brand-900 shadow-lift-lg hover:bg-brand-50"
                >
                  {t('cta')}
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/5 text-white backdrop-blur-sm hover:border-white/60 hover:bg-white/10"
                >
                  {t('contactCta')}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-500/10 via-transparent to-violet-500/10 blur-2xl"
              aria-hidden
            />

            <div className="relative space-y-3 sm:space-y-4">
              {highlights.map(({ icon: Icon, key, accent, iconBg, step }, index) => (
                <div
                  key={key}
                  className={cn(
                    'group relative overflow-hidden border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition duration-500 sm:p-5',
                    'hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.07]',
                    'hover:shadow-[0_20px_60px_-24px_rgba(255,255,255,0.12)]',
                    index === 1 && 'sm:ml-6 lg:ml-8',
                    index === 2 && 'sm:ml-3 lg:ml-4',
                  )}
                >
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70 transition group-hover:opacity-100',
                      accent,
                    )}
                    aria-hidden
                  />

                  <div className="relative flex gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                        {step}
                      </span>
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center ring-1',
                          iconBg,
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white sm:text-base">
                          {t(`steps.${key}.title`)}
                        </h3>
                        <ArrowUpRight
                          className="h-4 w-4 shrink-0 text-white/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-200"
                          aria-hidden
                        />
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-brand-100/70">
                        {t(`steps.${key}.description`)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
