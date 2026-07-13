import {
  designTemplates,
  type DesignTemplate,
} from '@/lib/data/catalog';
import {
  EXCLUSIVE_BUSINESS_CARD_PRICE,
  exclusiveBusinessCardTemplates,
  getExclusiveBusinessCardTemplate,
  isExclusiveBusinessCardId,
} from '@/lib/data/exclusive-business-cards';
import {
  catalogDesignsDb,
  type CatalogDesignRecord,
  type DesignAvailability,
} from '@/lib/db/catalog-designs';
import { unstable_cache } from 'next/cache';
import { CATALOG_CACHE_SECONDS } from '@/lib/cache/catalog-cache';

export const CATALOG_DESIGNS_CACHE_TAG = 'catalog-designs';

export type ManagedDesignTemplate = DesignTemplate & {
  managed: true;
  availability: DesignAvailability;
  exclusive: boolean;
  customPrice: number | null;
  nameEn: string;
  nameMk: string;
  descriptionEn: string | null;
  descriptionMk: string | null;
};

export type ResolvedDesignTemplate = DesignTemplate & {
  managed?: boolean;
  availability?: DesignAvailability;
  exclusive?: boolean;
  customPrice?: number | null;
  nameEn?: string;
  nameMk?: string;
  descriptionEn?: string | null;
  descriptionMk?: string | null;
};

function mapRecordToTemplate(record: CatalogDesignRecord): ManagedDesignTemplate {
  return {
    id: record.id,
    category: record.category,
    image: record.image,
    tags: record.tags,
    kind: record.kind,
    thumbAspect: record.thumbAspect ?? undefined,
    svgTemplateId: record.svgTemplateId ?? undefined,
    layoutId: record.layoutId ?? undefined,
    managed: true,
    availability: record.availability,
    exclusive: record.exclusive,
    customPrice: record.price,
    nameEn: record.nameEn,
    nameMk: record.nameMk,
    descriptionEn: record.descriptionEn,
    descriptionMk: record.descriptionMk,
  };
}

function mapExclusivePackToTemplate(
  record: CatalogDesignRecord | null,
  pack = getExclusiveBusinessCardTemplate(record?.id ?? ''),
): ManagedDesignTemplate | null {
  if (!pack) return null;

  return {
    id: pack.id,
    category: pack.category,
    image: record?.image ?? pack.image,
    tags: record?.tags ?? pack.tags,
    kind: pack.kind,
    thumbAspect: record?.thumbAspect ?? pack.thumbAspect,
    managed: true,
    availability: record?.availability ?? 'available',
    exclusive: true,
    customPrice: record?.price ?? EXCLUSIVE_BUSINESS_CARD_PRICE,
    nameEn: record?.nameEn ?? pack.nameEn,
    nameMk: record?.nameMk ?? pack.nameMk,
    descriptionEn: record?.descriptionEn ?? null,
    descriptionMk: record?.descriptionMk ?? null,
  };
}

function getPublishedExclusiveBusinessCards(
  managedRecords: CatalogDesignRecord[],
): ManagedDesignTemplate[] {
  const recordsById = new Map(managedRecords.map((record) => [record.id, record]));

  return exclusiveBusinessCardTemplates
    .map((pack) => mapExclusivePackToTemplate(recordsById.get(pack.id) ?? null, pack))
    .filter((template): template is ManagedDesignTemplate => template !== null)
    .filter((template) => template.availability === 'available');
}

const staticDesignIds = new Set(designTemplates.map((design) => design.id));

const exclusiveBusinessCardIdSet = new Set(
  exclusiveBusinessCardTemplates.map((template) => template.id),
);

const getCatalogDesignRecordsCached = unstable_cache(
  async () => catalogDesignsDb.list(),
  ['catalog-design-records-v3'],
  {
    revalidate: CATALOG_CACHE_SECONDS,
    tags: [CATALOG_DESIGNS_CACHE_TAG],
  },
);

function mergeStaticAndManagedRecord(
  staticTemplate: DesignTemplate,
  mapped: ManagedDesignTemplate,
): ResolvedDesignTemplate {
  return {
    ...staticTemplate,
    ...mapped,
    kind:
      mapped.kind === 'customizable' || staticTemplate.kind === 'customizable'
        ? 'customizable'
        : mapped.kind,
    svgTemplateId: mapped.svgTemplateId || staticTemplate.svgTemplateId,
    layoutId: mapped.layoutId || staticTemplate.layoutId,
    image: mapped.image || staticTemplate.image,
    tags: mapped.tags.length > 0 ? mapped.tags : staticTemplate.tags,
  };
}

function resolveDesignFromRecords(
  id: string,
  managedRecords: CatalogDesignRecord[],
): ResolvedDesignTemplate | null {
  const managed = managedRecords.find((record) => record.id === id) ?? null;
  const staticTemplate = staticDesignIds.has(id)
    ? (designTemplates.find((design) => design.id === id) ?? null)
    : null;

  if (managed) {
    const mapped = mapRecordToTemplate(managed);
    if (staticTemplate) {
      return mergeStaticAndManagedRecord(staticTemplate, mapped);
    }
    return mapped;
  }

  if (isExclusiveBusinessCardId(id)) {
    return mapExclusivePackToTemplate(null, getExclusiveBusinessCardTemplate(id));
  }

  return staticTemplate;
}

function buildPublishedDesignTemplates(
  managedRecords: CatalogDesignRecord[],
): ResolvedDesignTemplate[] {
  const managed = managedRecords.map(mapRecordToTemplate);
  const publishedExclusive = getPublishedExclusiveBusinessCards(managedRecords);

  const managedById = new Map(managed.map((design) => [design.id, design]));
  const staticById = new Map(designTemplates.map((design) => [design.id, design]));

  const publishedManaged = managed
    .filter(
      (design) =>
        design.availability === 'available' &&
        !exclusiveBusinessCardIdSet.has(design.id),
    )
    .map((design) => {
      const staticTemplate = staticById.get(design.id);
      return staticTemplate
        ? mergeStaticAndManagedRecord(staticTemplate, design)
        : design;
    });

  const publishedManagedIds = new Set(publishedManaged.map((design) => design.id));

  const staticPublished = designTemplates
    .filter((design) => {
      if (publishedManagedIds.has(design.id)) return false;

      const overlay = managedById.get(design.id);
      if (!overlay) return true;
      if (overlay.availability === 'available') return false;
      if (overlay.exclusive && overlay.availability !== 'available') return false;
      if (overlay.exclusive) return false;
      return true;
    })
    .map((design) => {
      const overlay = managedById.get(design.id);
      return overlay
        ? mergeStaticAndManagedRecord(design, overlay)
        : design;
    });

  return [...staticPublished, ...publishedManaged, ...publishedExclusive];
}

export async function getCachedCatalogDesignRecords(): Promise<CatalogDesignRecord[]> {
  return getCatalogDesignRecordsCached();
}

export async function getManagedDesignTemplates(): Promise<ManagedDesignTemplate[]> {
  const records = await catalogDesignsDb.list();
  return records.map(mapRecordToTemplate);
}

async function fetchPublishedDesignTemplates(): Promise<ResolvedDesignTemplate[]> {
  const managedRecords = await getCatalogDesignRecordsCached();
  return buildPublishedDesignTemplates(managedRecords);
}

export const getPublishedDesignTemplates = unstable_cache(
  fetchPublishedDesignTemplates,
  ['published-design-templates-v3'],
  {
    revalidate: CATALOG_CACHE_SECONDS,
    tags: [CATALOG_DESIGNS_CACHE_TAG],
  },
);

export async function getAllDesignTemplatesForAdmin(): Promise<{
  static: DesignTemplate[];
  managed: ManagedDesignTemplate[];
}> {
  const managed = await getManagedDesignTemplates();
  const managedIds = new Set(managed.map((design) => design.id));

  return {
    static: designTemplates.filter((design) => !managedIds.has(design.id)),
    managed,
  };
}

export async function resolveDesignTemplate(
  id: string,
): Promise<ResolvedDesignTemplate | null> {
  const records = await getCatalogDesignRecordsCached();
  return resolveDesignFromRecords(id, records);
}

export function getDesignDisplayName(
  design: ResolvedDesignTemplate,
  locale: 'mk' | 'en',
) {
  if (design.nameEn || design.nameMk) {
    return locale === 'mk'
      ? (design.nameMk ?? design.nameEn ?? design.id)
      : (design.nameEn ?? design.nameMk ?? design.id);
  }

  return design.id;
}

export function isDesignOrderable(design: ResolvedDesignTemplate) {
  if (!design.managed) return true;
  if (!design.exclusive) return true;
  return design.availability === 'available';
}

export function isManagedDesign(
  design: ResolvedDesignTemplate,
): design is ManagedDesignTemplate {
  return Boolean(design.managed);
}
