import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  designCategories,
  type DesignCategory,
  type DesignTemplate,
} from '@/lib/data/catalog';
import type { ResolvedDesignTemplate } from '@/lib/catalog/design-catalog';
import {
  designCategoryHref,
  designCategoryIcons,
  designNavQuickLinks,
  designsAllHref,
} from '@/lib/designs/design-nav';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const categoryAccents: Record<
  DesignCategory,
  { gradient: string; ring: string; badge: string }
> = {
  'business-cards': {
    gradient: 'from-slate-400/20 via-slate-500/10 to-transparent',
    ring: 'group-hover:ring-slate-300/50',
    badge: 'bg-slate-600/90',
  },
  wedding: {
    gradient: 'from-rose-400/25 via-fuchsia-500/10 to-transparent',
    ring: 'group-hover:ring-rose-300/50',
    badge: 'bg-rose-500/90',
  },
  birthday: {
    gradient: 'from-lime-400/20 via-emerald-500/10 to-transparent',
    ring: 'group-hover:ring-lime-300/50',
    badge: 'bg-lime-600/90',
  },
  menus: {
    gradient: 'from-amber-300/25 via-orange-500/10 to-transparent',
    ring: 'group-hover:ring-amber-300/50',
    badge: 'bg-amber-600/90',
  },
  general: {
    gradient: 'from-brand-400/20 via-brand-500/10 to-transparent',
    ring: 'group-hover:ring-brand-300/50',
    badge: 'bg-brand-600/90',
  },
};

function countByCategory(designs: DesignTemplate[]) {
  const counts = new Map<DesignCategory, number>();
  for (const design of designs) {
    counts.set(design.category, (counts.get(design.category) ?? 0) + 1);
  }
  return counts;
}

export async function DesignsCategoriesOverview({
  designs,
}: {
  designs: ResolvedDesignTemplate[];
}) {
  const t = await getTranslations('designs');
  const tn = await getTranslations('nav.designsMenu.links');
  const counts = countByCategory(designs);
  const visibleCategories = designCategories.filter(
    (category) => (counts.get(category) ?? 0) > 0,
  );

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow mb-2">{t('categoriesOverview.eyebrow')}</p>
          <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
            {t('categoriesOverview.title')}
          </h2>
          <p className="mt-2 max-w-2xl text-ink-600">
            {t('categoriesOverview.subtitle')}
          </p>
        </div>
        <Link href={designsAllHref()} className="shrink-0">
          <Button size="lg" className="gap-2">
            {t('categoriesOverview.seeAll')}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleCategories.map((category) => {
          const Icon = designCategoryIcons[category];
          const accent = categoryAccents[category];
          const count = counts.get(category) ?? 0;

          return (
            <Link
              key={category}
              href={designCategoryHref(category)}
              className="group block h-full"
            >
              <article
                className={cn(
                  'relative flex h-full flex-col overflow-hidden border border-ink-200 bg-white p-5 transition duration-300',
                  'hover:-translate-y-1 hover:border-brand-200 hover:shadow-lift-brand',
                  'ring-1 ring-transparent',
                  accent.ring,
                )}
              >
                <div
                  className={cn(
                    'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80',
                    accent.gradient,
                  )}
                  aria-hidden
                />
                <div className="relative flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center border border-brand-200 bg-brand-50 text-brand-700">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white',
                      accent.badge,
                    )}
                  >
                    {t('categoriesOverview.count', { count })}
                  </span>
                </div>
                <div className="relative mt-5 flex flex-1 flex-col">
                  <h3 className="text-lg font-bold text-ink-900 group-hover:text-brand-700">
                    {t(`categories.${category}`)}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                    {t(`categoryDescriptions.${category}`)}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                    {t('categoriesOverview.browse')}
                    <ArrowRight
                      className="h-4 w-4 transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      <section className="border-t border-ink-200 pt-10">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" aria-hidden />
          <h2 className="text-xl font-bold text-ink-900">
            {t('categoriesOverview.moreWaysTitle')}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {designNavQuickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.id}
                href={link.href}
                className="group flex gap-3 border border-ink-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900 group-hover:text-brand-700">
                    {tn(link.labelKey)}
                  </p>
                  <p className="mt-1 text-sm text-ink-600">
                    {tn(link.descriptionKey)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
