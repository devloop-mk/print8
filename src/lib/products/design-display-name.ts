import type { ProductDesignTemplate } from '@/lib/data/catalog';

export type ProductDesignDisplayFields = Pick<
  ProductDesignTemplate,
  'nameKey' | 'titleEn' | 'titleMk'
>;

export function getProductDesignDisplayName(
  design: ProductDesignDisplayFields,
  locale: 'mk' | 'en',
) {
  if (locale === 'mk' && design.titleMk) return design.titleMk;
  if (design.titleEn) return design.titleEn;
  if (design.titleMk) return design.titleMk;
  return design.nameKey;
}

export function humanizeProductDesignNameKey(nameKey: string): string {
  if (nameKey.includes('-')) {
    return nameKey
      .split('-')
      .map((part) =>
        part ? part.charAt(0).toUpperCase() + part.slice(1) : part,
      )
      .join(' ');
  }
  return nameKey
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());
}

export type ProductDesignNameTranslator = ((key: string) => string) & {
  has?: (key: string) => boolean;
};

export function resolveProductDesignDisplayName(
  design: ProductDesignDisplayFields,
  locale: 'mk' | 'en',
  translateNameKey: ProductDesignNameTranslator,
) {
  const fromData = getProductDesignDisplayName(design, locale);
  if (fromData !== design.nameKey) return fromData;

  const messageKey = `designs.${design.nameKey}`;
  if (translateNameKey.has && !translateNameKey.has(messageKey)) {
    return humanizeProductDesignNameKey(design.nameKey);
  }

  try {
    return translateNameKey(messageKey);
  } catch {
    return humanizeProductDesignNameKey(design.nameKey);
  }
}
