import {
  getCouplePackTemplates,
  type CouplePackTemplate,
} from '@/lib/data/couple-pack';
import { COUPLES_DESIGN_COLLECTION } from '@/lib/products/paths';

export function isCouplesDesignCollection(
  collection: string | undefined,
): boolean {
  return collection === COUPLES_DESIGN_COLLECTION;
}

export function getCouplesPackTemplates(
  initialPacks?: CouplePackTemplate[],
): CouplePackTemplate[] {
  return initialPacks ?? getCouplePackTemplates();
}

export function filterCouplesPacksBySearchQuery(
  packs: CouplePackTemplate[],
  query: string,
): CouplePackTemplate[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return packs;

  return packs.filter((pack) => {
    const haystack = `${pack.titleEn} ${pack.titleMk} ${pack.partnerDesigns
      .map((partner) => `${partner.labelEn} ${partner.labelMk}`)
      .join(' ')}`.toLowerCase();
    return haystack.includes(trimmed);
  });
}
