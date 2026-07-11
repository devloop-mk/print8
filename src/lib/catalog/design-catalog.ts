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



export async function getManagedDesignTemplates(): Promise<ManagedDesignTemplate[]> {

  const records = await catalogDesignsDb.list();

  return records.map(mapRecordToTemplate);

}



async function fetchPublishedDesignTemplates(): Promise<ResolvedDesignTemplate[]> {

  const managedRecords = await catalogDesignsDb.list();

  const managed = managedRecords.map(mapRecordToTemplate);

  const publishedExclusive = getPublishedExclusiveBusinessCards(managedRecords);



  const publishedManaged = managed.filter(

    (design) =>

      design.availability === 'available' &&

      !exclusiveBusinessCardIdSet.has(design.id),

  );



  const managedIds = new Set([

    ...managed.map((design) => design.id),

    ...exclusiveBusinessCardIdSet,

  ]);

  const staticPublished = designTemplates.filter(

    (design) => !managedIds.has(design.id),

  );



  return [...staticPublished, ...publishedManaged, ...publishedExclusive];

}

export const getPublishedDesignTemplates = unstable_cache(
  fetchPublishedDesignTemplates,
  ['published-design-templates'],
  {
    revalidate: CATALOG_CACHE_SECONDS,
    tags: ['catalog-designs'],
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

  const managed = await catalogDesignsDb.findById(id);

  if (managed) return mapRecordToTemplate(managed);



  if (isExclusiveBusinessCardId(id)) {

    return mapExclusivePackToTemplate(null, getExclusiveBusinessCardTemplate(id));

  }



  if (staticDesignIds.has(id)) {

    return designTemplates.find((design) => design.id === id) ?? null;

  }



  return null;

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

  return design.availability === 'available';

}



export function isManagedDesign(

  design: ResolvedDesignTemplate,

): design is ManagedDesignTemplate {

  return Boolean(design.managed);

}


