import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  designCategories,
  type DesignCategory,
} from '@/lib/data/catalog';
import {
  designCategoryCoverImages,
  designCategoryHref,
  designCategoryIcons,
  designNavQuickLinks,
  designsAllHref,
} from '@/lib/designs/design-nav';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const categoryAccents: Record<
  DesignCategory,
  { media: string; badge: string }
> = {
  'business-cards': {
    media: 'bg-slate-100',
    badge: 'bg-slate-700/95',
  },
  wedding: {
    media: 'bg-rose-50',
    badge: 'bg-rose-500/95',
  },
  birthday: {
    media: 'bg-lime-50',
    badge: 'bg-lime-600/95',
  },
  menus: {
    media: 'bg-amber-50',
    badge: 'bg-amber-600/95',
  },
  general: {
    media: 'bg-brand-50',
    badge: 'bg-brand-600/95',
  },
};

export async function DesignsCategoriesOverview({
  categoryCounts,
}: {
  categoryCounts: Partial<Record<DesignCategory, number>>;
}) {
  const t = await getTranslations('designs');
  const tn = await getTranslations('nav.designsMenu.links');
  const visibleCategories = designCategories.filter(
    (category) => (categoryCounts[category] ?? 0) > 0,
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
          const count = categoryCounts[category] ?? 0;
          const cover = designCategoryCoverImages[category];
          const title = t(`categories.${category}`);

          return (
            <Link
              key={category}
              href={designCategoryHref(category)}
              className="group block h-full"
            >
              <article
                className={cn(
                  'flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-sm',
                  'transition duration-300 hover:border-brand-300 hover:shadow-md',
                )}
              >
                <div
                  className={cn(
                    'relative aspect-[4/3] overflow-hidden',
                    accent.media,
                  )}
                >
                  <Image
                    src={cover}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-contain p-5 transition duration-500 group-hover:scale-[1.03]"
                  />
                  <span
                    className={cn(
                      'absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm',
                      accent.badge,
                    )}
                  >
                    {t('categoriesOverview.count', { count })}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-brand-200 bg-brand-50 text-brand-700">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <h3 className="text-lg font-bold text-ink-900 transition group-hover:text-brand-700">
                      {title}
                    </h3>
                  </div>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-600">
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
                className="group flex gap-3 rounded-xl border border-ink-200 bg-white p-4 transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-700">
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
