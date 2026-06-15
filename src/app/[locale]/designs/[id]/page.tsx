import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getDesignTemplate } from '@/lib/data/catalog';
import { DesignOrderForm } from '@/components/designs/DesignOrderForm';
import { ArrowLeft, Palette } from 'lucide-react';

export default async function DesignOrderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const template = getDesignTemplate(id);
  if (!template) notFound();

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
      </div>

      <DesignOrderForm template={template} />

      <div className="mt-10 rounded-xl border border-ink-200 bg-ink-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Palette className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
            <div>
              <p className="font-medium text-ink-900">{t('studioTitle')}</p>
              <p className="mt-1 text-sm text-ink-600">{t('studioHint')}</p>
            </div>
          </div>
          <Link
            href={`/designs/create?template=${template.id}`}
            className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            {t('openStudio')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
