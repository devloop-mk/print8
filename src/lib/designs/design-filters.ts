import {
  designTemplates,
  type DesignCategory,
  type DesignTemplate,
} from '@/lib/data/catalog';

export type DesignSubfilterId = string;

type DesignSubfilterDef = {
  id: DesignSubfilterId;
  tags?: string[];
  excludeTags?: string[];
};

const designCategorySubfilterDefs: Partial<
  Record<DesignCategory, DesignSubfilterDef[]>
> = {
  birthday: [
    { id: 'kids', tags: ['kids'] },
    { id: 'adults', excludeTags: ['kids'] },
    { id: 'elegant', tags: ['gold', 'rose-gold', 'elegant'] },
  ],
  wedding: [
    { id: 'modern', tags: ['modern'] },
    { id: 'romantic', tags: ['romantic', 'blush'] },
    { id: 'classic', tags: ['classic', 'navy'] },
    { id: 'botanical', tags: ['botanical', 'garden', 'watercolor'] },
    { id: 'rustic', tags: ['rustic', 'autumn', 'terracotta'] },
    { id: 'beach', tags: ['beach', 'coastal'] },
    { id: 'celestial', tags: ['celestial', 'stars'] },
    { id: 'winter', tags: ['winter', 'snow'] },
  ],
  'business-cards': [
    { id: 'modern', tags: ['modern', 'tech'] },
    { id: 'luxury', tags: ['luxury', 'gold'] },
    { id: 'corporate', tags: ['corporate', 'professional'] },
    { id: 'creative', tags: ['creative', 'abstract'] },
  ],
  menus: [
    { id: 'rustic', tags: ['rustic', 'italian'] },
    { id: 'fine-dining', tags: ['fine-dining', 'steakhouse'] },
  ],
};

function designMatchesSubfilter(
  design: DesignTemplate,
  def: DesignSubfilterDef,
): boolean {
  if (def.tags?.length) {
    return def.tags.some((tag) => design.tags.includes(tag));
  }

  if (def.excludeTags?.length) {
    return !def.excludeTags.some((tag) => design.tags.includes(tag));
  }

  return true;
}

export function getAvailableDesignSubfilters(
  category: DesignCategory,
  designs: DesignTemplate[] = designTemplates,
): DesignSubfilterDef[] {
  const defs = designCategorySubfilterDefs[category] ?? [];
  const inCategory = designs.filter((design) => design.category === category);

  return defs.filter((def) =>
    inCategory.some((design) => designMatchesSubfilter(design, def)),
  );
}

export function filterDesignsBySubfilter(
  designs: DesignTemplate[],
  subfilterId: DesignSubfilterId | 'all',
  category: DesignCategory,
): DesignTemplate[] {
  if (subfilterId === 'all') return designs;

  const def = designCategorySubfilterDefs[category]?.find(
    (item) => item.id === subfilterId,
  );
  if (!def) return designs;

  return designs.filter((design) => designMatchesSubfilter(design, def));
}

export function parseDesignSubfilterFilter(
  value: string | null,
  category: DesignCategory | 'all',
): DesignSubfilterId | 'all' {
  if (!value || category === 'all') return 'all';

  const available = getAvailableDesignSubfilters(category);
  if (available.some((item) => item.id === value)) return value;
  return 'all';
}
