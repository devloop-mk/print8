import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import {
  getDesignTemplate,
  isCustomizableDesign,
} from '@/lib/data/catalog';
import { getDesignLayout } from '@/lib/data/design-layouts';
import { getSvgDesignTemplate } from '@/lib/data/svg-design-templates';
import { CustomizableDesignForm } from '@/components/designs/CustomizableDesignForm';
import { SvgCustomizableDesignForm } from '@/components/designs/SvgCustomizableDesignForm';
import { buildDesignCustomizeMetadata } from '@/lib/seo/page-metadata';
import type { Locale } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const metadata = await buildDesignCustomizeMetadata(locale as Locale, id);
  if (!metadata) notFound();
  return metadata;
}

export default async function CustomizeDesignPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const template = getDesignTemplate(id);
  if (!template || !isCustomizableDesign(template)) notFound();

  const t = await getTranslations('designs.customize');
  const td = await getTranslations('designs');

  const header = (
    <>
      <Link
        href="/designs"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('backToDesigns')}
      </Link>

      <div className="mb-6 min-w-0 lg:mb-8">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
          {td(`categories.${template.category}`)} · {t('badge')}
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-ink-900 sm:text-3xl">
          {td(`templates.${template.id}`)}
        </h1>
        <p className="mt-2 max-w-3xl break-words text-base text-ink-600 lg:text-lg">
          {t('pageSubtitle')}
        </p>
      </div>
    </>
  );

  if (template.svgTemplateId) {
    const svgTemplate = getSvgDesignTemplate(template.svgTemplateId);
    if (!svgTemplate) notFound();

    return (
      <div className="mx-auto w-full min-w-0 max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {header}
        <SvgCustomizableDesignForm template={template} svgTemplate={svgTemplate} />
      </div>
    );
  }

  const layout = getDesignLayout(template.layoutId!);
  if (!layout) notFound();

  return (
    <div className="mx-auto w-full min-w-0 max-w-[96rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      {header}
      <CustomizableDesignForm template={template} layout={layout} />
    </div>
  );
}
