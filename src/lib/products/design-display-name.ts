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

export function resolveProductDesignDisplayName(
  design: ProductDesignTemplate,
  locale: 'mk' | 'en',
  translateNameKey: (key: string) => string,
) {
  const fromData = getProductDesignDisplayName(design, locale);
  if (fromData !== design.nameKey) return fromData;
  return translateNameKey(`designs.${design.nameKey}`);
}
