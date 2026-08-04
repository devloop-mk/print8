import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link, redirect } from '@/i18n/navigation';
import { isCustomizableDesign } from '@/lib/data/catalog';
import {
  getDesignDisplayName,
  isDesignOrderable,
  resolveDesignTemplate,
} from '@/lib/catalog/design-catalog';
import { DesignOrderForm } from '@/components/designs/DesignOrderForm';
import { DesignCategoryGallery } from '@/components/designs/DesignCategoryGallery';
import {
  buildDesignCategoryMetadata,
  buildDesignMetadata,
} from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { isDesignCategory, designCategoryHref } from '@/lib/designs/design-nav';
import { ArrowLeft } from 'lucide-react';

/** Category galleries load the full published catalog. */
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (isDesignCategory(id)) {
    return buildDesignCategoryMetadata(locale as Locale, id);
  }
  const metadata = await buildDesignMetadata(locale as Locale, id);
  if (!metadata) notFound();
  return metadata;
}

export default async function DesignSlugPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id, locale } = await params;

  if (isDesignCategory(id)) {
    return <DesignCategoryGallery category={id} />;
  }

  const template = await resolveDesignTemplate(id);
  if (!template) notFound();
  if (isCustomizableDesign(template)) {
    redirect({ href: `/designs/${id}/customize`, locale });
  }

  const t = await getTranslations('designs.order');
  const td = await getTranslations('designs');
  const displayName =
    getDesignDisplayName(template, locale as 'mk' | 'en') !== template.id
      ? getDesignDisplayName(template, locale as 'mk' | 'en')
      : td(`templates.${template.id}`);
  const orderable = isDesignOrderable(template);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href={designCategoryHref(template.category)}
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('backToDesigns')}
      </Link>

      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          {td(`categories.${template.category}`)}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-ink-900">
          {displayName}
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-600">{t('pageSubtitle')}</p>
        <p className="mt-2 text-sm font-medium text-ink-500">{t('fixedBadge')}</p>
        {template.exclusive ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('exclusiveNote')}
          </p>
        ) : null}
        {!orderable ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {t('unavailableDesign')}
          </p>
        ) : null}
      </div>

      <DesignOrderForm
        template={template}
        displayName={displayName}
        orderable={orderable}
        exclusive={Boolean(template.exclusive)}
      />
    </div>
  );
}
