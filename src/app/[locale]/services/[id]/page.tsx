import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { services } from '@/lib/data/catalog';
import {
  getResolvedService,
  getResolvedServices,
  type CmsLocale,
} from '@/lib/cms/public-content';
import { ServiceDetailContent } from '@/components/services/ServiceDetailContent';
import { buildPageMetadata } from '@/lib/seo/metadata';
import type { Locale } from '@/i18n/routing';

export function generateStaticParams() {
  return services.map((service) => ({ id: service.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'services' });
  const ts = await getTranslations({ locale, namespace: 'services.items' });

  const service = await getResolvedService(id, locale as CmsLocale, (serviceId) => ({
    title: ts(`${serviceId}.title`),
    description: ts(`${serviceId}.description`),
    detail: ts(`${serviceId}.detail`),
  }));

  if (!service) {
    return { title: t('title') };
  }

  return buildPageMetadata({
    locale: locale as Locale,
    title: `${service.title} | Print 8`,
    description: service.description,
    path: `/services/${id}`,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const ts = await getTranslations({ locale, namespace: 'services.items' });

  const labelsFor = (serviceId: string) => ({
    title: ts(`${serviceId}.title`),
    description: ts(`${serviceId}.description`),
    detail: ts(`${serviceId}.detail`),
  });

  const service = await getResolvedService(id, locale as CmsLocale, labelsFor);
  if (!service) notFound();

  const all = await getResolvedServices(locale as CmsLocale, labelsFor);
  const related = all
    .filter(
      (item) => item.category === service.category && item.id !== service.id,
    )
    .slice(0, 4);

  return <ServiceDetailContent service={service} related={related} />;
}
