'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ImageIcon, Palette, Type } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import {
  getProductNavCategory,
  productCategoryBrowseHref,
  productCategoryReadyDesignsHref,
  productCategoryTextTemplatesHref,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { cn } from '@/lib/utils';

const primaryCta =
  'inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-700';
const secondaryCta =
  'inline-flex w-full items-center justify-center rounded-lg bg-ink-100 px-3 py-1.5 text-sm font-medium text-ink-900 transition hover:bg-ink-200';

export function ProductCategoryPathChooser({
  categoryId,
}: {
  categoryId: ProductNavCategoryId;
}) {
  const t = useTranslations('products.categoryPages');
  const tNav = useTranslations('nav.productsMenu.categories');
  const tp = useTranslations('products.typesPlural');
  const category = getProductNavCategory(categoryId);

  const pathOptions = [
    {
      id: 'custom',
      icon: Palette,
      title: t('choose.customTitle'),
      description: t('choose.customDesc'),
      badge: t('choose.customBadge'),
      cta: t('choose.customCta'),
      href: productCategoryBrowseHref(categoryId),
      primary: true,
    },
    {
      id: 'photo',
      icon: ImageIcon,
      title: t('choose.readyTitle'),
      description: t('choose.readyDesc'),
      badge: t('choose.readyBadge'),
      cta: t('choose.readyCta'),
      href: productCategoryReadyDesignsHref(categoryId),
      primary: false,
    },
    {
      id: 'template',
      icon: Type,
      title: t('choose.templateTitle'),
      description: t('choose.templateDesc'),
      badge: t('choose.templateBadge'),
      cta: t('choose.templateCta'),
      href: productCategoryTextTemplatesHref(categoryId),
      primary: false,
    },
  ];

  return (
    <div className="space-y-8">
      <Link
        href={PRODUCT_OFFERING_PATHS.all}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToAll')}
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">
          {tNav(categoryId)}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-600">
          {t(`${categoryId}.subtitle`)}
        </p>
      </div>

      <Reveal>
        <div className="overflow-hidden rounded-2xl border-2 border-brand-200 bg-white shadow-lift">
          <div className="border-b border-brand-100 bg-gradient-to-br from-brand-50/80 via-white to-white px-5 py-5 sm:px-6">
            <p className="eyebrow mb-3">{t('choose.eyebrow')}</p>
            <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">
              {t('choose.title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500 sm:text-base">
              {t('choose.subtitle', { category: tNav(categoryId) })}
            </p>
          </div>

          <div
            className={cn(
              'grid gap-3 p-4 sm:p-5',
              pathOptions.length === 2 ? 'sm:grid-cols-2' : 'lg:grid-cols-3',
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
                      path.primary
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
        </div>
      </Reveal>

      <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-6">
        {category.types.map((type) => (
          <Link
            key={type}
            href={`/products/type/${encodeURIComponent(type)}`}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            {t('choose.browseType', { type: tp(type) })}
          </Link>
        ))}
      </div>
    </div>
  );
}
