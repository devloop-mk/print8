import type { DesignCategory } from '@/lib/data/catalog';
import { businessCardPack100Templates } from '@/lib/data/business-card-pack-100';
import enMessages from '../../../messages/en.json';
import mkMessages from '../../../messages/mk.json';

export const EXCLUSIVE_BUSINESS_CARD_PRICE = 500;

export type ExclusiveBusinessCardTemplate = {
  id: string;
  category: DesignCategory;
  image: string;
  tags: string[];
  kind: 'fixed';
  thumbAspect: number;
  exclusive: true;
  nameEn: string;
  nameMk: string;
  sortOrder: number;
};

const templateNamesEn = enMessages.designs.templates as Record<string, string>;
const templateNamesMk = mkMessages.designs.templates as Record<string, string>;

export const exclusiveBusinessCardTemplates: ExclusiveBusinessCardTemplate[] =
  businessCardPack100Templates.map((template, index) => ({
    id: template.id,
    category: template.category,
    image: template.image,
    tags: template.tags,
    kind: 'fixed' as const,
    thumbAspect: template.thumbAspect ?? 1.75,
    exclusive: true as const,
    nameEn: templateNamesEn[template.id] ?? template.id,
    nameMk: templateNamesMk[template.id] ?? template.id,
    sortOrder: index + 1,
  }));

const exclusiveBusinessCardIds = new Set(
  exclusiveBusinessCardTemplates.map((template) => template.id),
);

export function isExclusiveBusinessCardId(id: string) {
  return exclusiveBusinessCardIds.has(id);
}

export function getExclusiveBusinessCardTemplate(id: string) {
  return exclusiveBusinessCardTemplates.find((template) => template.id === id) ?? null;
}

export function toExclusiveBusinessCardRecordInput(
  template: ExclusiveBusinessCardTemplate,
) {
  return {
    id: template.id,
    category: template.category,
    kind: template.kind,
    image: template.image,
    tags: template.tags,
    thumbAspect: template.thumbAspect,
    exclusive: true,
    availability: 'available' as const,
    price: EXCLUSIVE_BUSINESS_CARD_PRICE,
    sortOrder: template.sortOrder,
    nameEn: template.nameEn,
    nameMk: template.nameMk,
    descriptionEn: null,
    descriptionMk: null,
    svgTemplateId: null,
    layoutId: null,
  };
}
