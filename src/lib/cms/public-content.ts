import { cmsDb } from '@/lib/db/cms';
import {
  getFeaturedServices,
  getServicesByCategory,
  services as staticServices,
  type Service,
  type ServiceCategoryId,
} from '@/lib/data/catalog';
import { unstable_cache } from 'next/cache';

export type CmsLocale = 'mk' | 'en';

type ContentMap = Map<string, { en: string; mk: string }>;

const CMS_CACHE_SECONDS = 300;

const getContentMapCached = unstable_cache(
  async (): Promise<Array<[string, { en: string; mk: string }]>> => {
    const rows = await cmsDb.content.list();
    return rows.map((row) => [row.key, { en: row.valueEn, mk: row.valueMk }]);
  },
  ['cms-content-map'],
  { revalidate: CMS_CACHE_SECONDS, tags: ['cms-content'] },
);

const getCmsServicesCached = unstable_cache(
  async () => cmsDb.services.list(),
  ['cms-services'],
  { revalidate: CMS_CACHE_SECONDS, tags: ['cms-services'] },
);

async function getContentMap(): Promise<ContentMap> {
  const entries = await getContentMapCached();
  return new Map(entries);
}

export function clearCmsContentCache() {
  // Kept for admin hooks — Next cache revalidates via tag on CMS updates.
}

export async function resolveCmsText(
  key: string,
  locale: CmsLocale,
  fallback: string,
): Promise<string> {
  const map = await getContentMap();
  const entry = map.get(key);
  if (!entry) return fallback;
  const value = locale === 'mk' ? entry.mk : entry.en;
  return value.trim() || fallback;
}

export async function resolveCmsTexts(
  keys: Array<{ key: string; fallback: string }>,
  locale: CmsLocale,
): Promise<Record<string, string>> {
  const map = await getContentMap();
  const result: Record<string, string> = {};

  for (const { key, fallback } of keys) {
    const entry = map.get(key);
    if (!entry) {
      result[key] = fallback;
      continue;
    }
    const value = locale === 'mk' ? entry.mk : entry.en;
    result[key] = value.trim() || fallback;
  }

  return result;
}

export type ResolvedService = Service & {
  title: string;
  description: string;
  detail: string;
};

async function resolveServiceLabels(
  service: Service,
  locale: CmsLocale,
  labels: {
    title: string;
    description: string;
    detail?: string;
  },
  cmsServices: Awaited<ReturnType<typeof getCmsServicesCached>>,
): Promise<ResolvedService> {
  const cms = cmsServices.find((item) => item.id === service.id);

  if (!cms) {
    return {
      ...service,
      title: labels.title,
      description: labels.description,
      detail: labels.detail ?? '',
    };
  }

  return {
    ...service,
    startingPrice: cms.startingPrice,
    featured: cms.featured,
    title:
      locale === 'mk'
        ? cms.titleMk || cms.titleEn || labels.title
        : cms.titleEn || cms.titleMk || labels.title,
    description:
      locale === 'mk'
        ? cms.descriptionMk || cms.descriptionEn || labels.description
        : cms.descriptionEn || cms.descriptionMk || labels.description,
    detail:
      locale === 'mk'
        ? cms.detailMk || cms.detailEn || labels.detail || ''
        : cms.detailEn || cms.detailMk || labels.detail || '',
  };
}

export async function getResolvedServices(
  locale: CmsLocale,
  labelsFor: (id: string) => { title: string; description: string; detail?: string },
): Promise<ResolvedService[]> {
  const cmsServices = await getCmsServicesCached();
  const inactiveIds = new Set(
    cmsServices.filter((service) => !service.active).map((service) => service.id),
  );

  const activeStatic = staticServices.filter((service) => !inactiveIds.has(service.id));

  return Promise.all(
    activeStatic.map((service) =>
      resolveServiceLabels(service, locale, labelsFor(service.id), cmsServices),
    ),
  );
}

export async function getResolvedFeaturedServices(
  locale: CmsLocale,
  labelsFor: (id: string) => { title: string; description: string; detail?: string },
): Promise<ResolvedService[]> {
  const resolved = await getResolvedServices(locale, labelsFor);
  return resolved.filter((service) => service.featured);
}

export async function getResolvedServicesByCategory(
  locale: CmsLocale,
  labelsFor: (id: string) => { title: string; description: string; detail?: string },
): Promise<Array<{ category: ServiceCategoryId; services: ResolvedService[] }>> {
  const resolved = await getResolvedServices(locale, labelsFor);
  const resolvedMap = new Map(resolved.map((service) => [service.id, service]));

  return getServicesByCategory().map(({ category, services: categoryServices }) => ({
    category,
    services: categoryServices
      .map((service) => resolvedMap.get(service.id))
      .filter((service): service is ResolvedService => Boolean(service)),
  }));
}

export async function getContactCmsValues(
  locale: CmsLocale,
  fallbacks: {
    phoneValue: string;
    emailValue: string;
    addressValue: string;
    hoursValue: string;
  },
) {
  return resolveCmsTexts(
    [
      { key: 'contact.phoneValue', fallback: fallbacks.phoneValue },
      { key: 'contact.emailValue', fallback: fallbacks.emailValue },
      { key: 'contact.addressValue', fallback: fallbacks.addressValue },
      { key: 'contact.hoursValue', fallback: fallbacks.hoursValue },
    ],
    locale,
  );
}
