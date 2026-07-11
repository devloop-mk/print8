import type { ProductDesignTemplate } from '@/lib/data/catalog';

export function getProductDesignDisplayName(
  design: ProductDesignTemplate,
  locale: 'mk' | 'en',
) {
  if (locale === 'mk' && design.titleMk) return design.titleMk;
  if (design.titleEn) return design.titleEn;
  if (design.titleMk) return design.titleMk;
  return design.nameKey;
}
