import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link, redirect } from '@/i18n/navigation';
import {
  getDesignTemplate,
  isCustomizableDesign,
} from '@/lib/data/catalog';
import { DesignOrderForm } from '@/components/designs/DesignOrderForm';
import { buildDesignMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const metadata = await buildDesignMetadata(locale as Locale, id);
  if (!metadata) notFound();
  return metadata;
}

export default async function DesignOrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id, locale } = await params;
  const template = getDesignTemplate(id);
  if (!template) notFound();
  if (isCustomizableDesign(template)) {
    redirect({ href: `/designs/${id}/customize`, locale });
  }

  const t = await getTranslations('designs.order');
  const td = await getTranslations('designs');

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/designs"
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
          {td(`templates.${template.id}`)}
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-ink-600">{t('pageSubtitle')}</p>
        <p className="mt-2 text-sm font-medium text-ink-500">{t('fixedBadge')}</p>
      </div>

      <DesignOrderForm template={template} />
    </div>
  );
}
