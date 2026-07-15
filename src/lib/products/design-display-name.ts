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

export function humanizeProductDesignNameKey(nameKey: string): string {
  if (nameKey.includes('-')) return nameKey;
  return nameKey
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());
}

export function resolveProductDesignDisplayName(
  design: ProductDesignTemplate,
  locale: 'mk' | 'en',
  translateNameKey: (key: string) => string,
) {
  const fromData = getProductDesignDisplayName(design, locale);
  if (fromData !== design.nameKey) return fromData;

  try {
    return translateNameKey(`designs.${design.nameKey}`);
  } catch {
    return humanizeProductDesignNameKey(design.nameKey);
  }
}
