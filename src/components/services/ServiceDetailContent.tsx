import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getServiceIcon } from '@/lib/data/service-icons';
import type { ResolvedService } from '@/lib/cms/public-content';
import {
  getServiceActionHref,
  getServiceActionKind,
  getServicePageHref,
} from '@/lib/services/service-links';
import { SERVICE_USE_CASE_KEYS } from '@/lib/services/service-use-cases';

export async function ServiceDetailContent({
  service,
  related,
}: {
  service: ResolvedService;
  related: ResolvedService[];
}) {
  const t = await getTranslations('services');
  const ts = await getTranslations('services.items');
  const Icon = getServiceIcon(service.icon);
  const actionHref = getServiceActionHref(service);
  const actionKind = getServiceActionKind(service);
  const actionLabel =
    actionKind === 'contact'
      ? t('contactUs')
      : actionKind === 'order-flow'
        ? t('startOrder')
        : t('seeOptions');

  const useCaseKeys = SERVICE_USE_CASE_KEYS[service.id] ?? [];
  const useCases = useCaseKeys.map((key) => ({
    key,
    title: ts(`${service.id}.useCases.${key}.title`),
    description: ts(`${service.id}.useCases.${key}.description`),
  }));
  const useCasesHeading = ts.has(`${service.id}.useCasesTitle`)
    ? ts(`${service.id}.useCasesTitle`)
    : t('useCasesTitle');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <Link
        href="/services"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('backToServices')}
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
        <article>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">
            {t(`categories.${service.category}.title`)}
          </p>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-brand-300 bg-brand-50 text-brand-700">
              <Icon className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                {service.title}
              </h1>
              <p className="mt-3 text-base leading-relaxed text-ink-600 sm:text-lg">
                {service.description}
              </p>
            </div>
          </div>

          {service.detail ? (
            <div className="mt-8 rounded-2xl border border-ink-100 bg-ink-50/60 p-5 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                {t('detailTitle')}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-ink-700">
                {service.detail}
              </p>
            </div>
          ) : null}

          {useCases.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-ink-900">{useCasesHeading}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {useCases.map((item) => (
                  <li
                    key={item.key}
                    className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm"
                  >
                    <p className="font-semibold text-ink-900">{item.title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={actionHref}>
              <Button size="lg">{actionLabel}</Button>
            </Link>
            {actionKind !== 'contact' ? (
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  {t('contactUs')}
                </Button>
              </Link>
            ) : null}
          </div>
        </article>

        <aside className="space-y-6 lg:pt-10">
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-ink-900">
              {t('whatNextTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {t(`whatNext.${actionKind}`)}
            </p>
            <Link href={actionHref} className="mt-4 inline-flex">
              <Button className="w-full sm:w-auto">{actionLabel}</Button>
            </Link>
          </div>

          {related.length > 0 ? (
            <div>
              <h2 className="text-sm font-semibold text-ink-900">
                {t('relatedServices')}
              </h2>
              <ul className="mt-3 space-y-2">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={getServicePageHref(item.id)}
                      className="block rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3 text-sm font-medium text-ink-800 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-800"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
