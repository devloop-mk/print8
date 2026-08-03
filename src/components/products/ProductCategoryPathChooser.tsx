'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import {
  getProductNavCategory,
  productCategoryBrowseHref,
  productCategoryReadyDesignsHref,
  productCategoryTextTemplatesHref,
  type ProductNavCategoryId,
} from '@/lib/products/product-nav';
import type { CategoryOffering } from '@/lib/products/offering';
import {
  getCategoryPathImage,
  type CategoryPathId,
} from '@/lib/products/category-path-images';
import {
  DESIGN_OVERLAY_LAYER_CLASS,
  getDesignOverlayLayerStyle,
} from '@/lib/products/design-overlay';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { useVisibleProductTypes } from '@/components/layout/ProductVisibilityProvider';
import { cn } from '@/lib/utils';

const primaryCta =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-brand-700';
const secondaryCta =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium text-ink-800 transition group-hover:border-brand-300 group-hover:bg-brand-50';

export function ProductCategoryPathChooser({
  categoryId,
  offering,
}: {
  categoryId: ProductNavCategoryId;
  offering: CategoryOffering;
}) {
  const t = useTranslations('products.categoryPages');
  const tNav = useTranslations('nav.productsMenu.categories');
  const tp = useTranslations('products.typesPlural');
  const category = getProductNavCategory(categoryId);
  const visibleProductTypes = useVisibleProductTypes();
  const visibleTypes = visibleProductTypes
    ? category.types.filter((type) => visibleProductTypes.includes(type))
    : category.types;

  const pathOptions = [
    {
      id: 'custom' as const,
      title: t('choose.customTitle'),
      description: t('choose.customDesc'),
      badge: t('choose.customBadge'),
      cta: t('choose.customCta'),
      href: productCategoryBrowseHref(categoryId),
      primary: true,
      show: true,
    },
    {
      id: 'photo' as const,
      title: t('choose.readyTitle'),
      description: t('choose.readyDesc'),
      badge: t('choose.readyBadge'),
      cta: t('choose.readyCta'),
      href: productCategoryReadyDesignsHref(categoryId),
      primary: false,
      show: offering.hasPhotoDesigns,
    },
    {
      id: 'template' as const,
      title: t('choose.templateTitle'),
      description: t('choose.templateDesc'),
      badge: t('choose.templateBadge'),
      cta: t('choose.templateCta'),
      href: productCategoryTextTemplatesHref(categoryId),
      primary: false,
      show: offering.hasTextTemplates,
    },
  ].filter((path) => {
    if (!path.show) return false;
    const allowed = category.chooserPaths;
    if (!allowed) return true;
    return allowed.includes(path.id);
  });

  return (
    <div className="space-y-10">
      <Link
        href={PRODUCT_OFFERING_PATHS.all}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToAll')}
      </Link>

      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          {t('choose.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink-900 sm:text-4xl">
          {tNav(categoryId)}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-600">
          {t(`${categoryId}.subtitle`)}
        </p>
      </div>

      <Reveal>
        <div
          className={cn(
            'grid gap-5',
            pathOptions.length === 1
              ? 'max-w-md'
              : pathOptions.length === 2
                ? 'sm:grid-cols-2'
                : 'md:grid-cols-2 xl:grid-cols-3',
          )}
        >
          {pathOptions.map((path) => {
            const visual = getCategoryPathImage(
              categoryId,
              path.id as CategoryPathId,
            );

            return (
              <Link
                key={path.id}
                href={path.href}
                className="group block h-full text-left"
              >
                <article
                  className={cn(
                    'flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition',
                    'group-hover:shadow-lift-brand',
                    path.primary
                      ? cn('ring-1', visual.ringClass)
                      : 'border-ink-200 group-hover:border-brand-200',
                  )}
                >
                  <div
                    className={cn(
                      'relative aspect-[5/4] overflow-hidden',
                      visual.imageBg ?? 'bg-ink-50',
                    )}
                  >
                    <div className="absolute inset-0 transition duration-500 group-hover:scale-105">
                      <Image
                        src={visual.src}
                        alt={path.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className={
                          visual.objectFit === 'contain'
                            ? 'object-contain p-4 pb-12'
                            : 'object-cover'
                        }
                        style={
                          visual.objectPosition
                            ? { objectPosition: visual.objectPosition }
                            : undefined
                        }
                      />
                      {visual.designOverlay ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={visual.designOverlay.src}
                          alt=""
                          aria-hidden
                          draggable={false}
                          className={DESIGN_OVERLAY_LAYER_CLASS}
                          style={getDesignOverlayLayerStyle({
                            position: visual.designOverlay.position,
                            scale: visual.designOverlay.scale,
                          })}
                        />
                      ) : null}
                    </div>
                    <div
                      className={cn(
                        'pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[42%] bg-gradient-to-t to-transparent',
                        visual.accent,
                      )}
                      aria-hidden
                    />
                    <div className="absolute left-3 top-3 z-10">
                      <span
                        className={cn(
                          'inline-flex max-w-[calc(100%-1.5rem)] items-center rounded-md px-2.5 py-1',
                          'text-[11px] font-bold uppercase tracking-wide text-white',
                          'shadow-md ring-1 ring-white/20',
                          visual.badgeClass,
                        )}
                      >
                        {path.badge}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="text-lg font-semibold text-ink-900 group-hover:text-brand-700">
                      {path.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">
                      {path.description}
                    </p>
                    <div className="mt-5">
                      <span className={path.primary ? primaryCta : secondaryCta}>
                        {path.cta}
                        <ArrowRight
                          className="h-4 w-4 transition group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </Reveal>

      {visibleTypes.length > 1 ? (
        <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-8">
          {visibleTypes.map((type) => (
            <Link
              key={type}
              href={`/products/type/${encodeURIComponent(type)}`}
              className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              {t('choose.browseType', { type: tp(type) })}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
