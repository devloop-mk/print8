import type { CouplePackTemplate } from '@/lib/data/couple-pack';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import {
  resolveDesignProduct,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import { resolveProductDesignDisplayName } from '@/lib/products/design-display-name';
import { getProductDisplayPrice } from '@/lib/products/tshirt-print-pricing';

export const DESIGN_CATALOG_SORT_OPTIONS = [
  'featured',
  'name-asc',
  'name-desc',
  'price-asc',
  'price-desc',
] as const;

export type DesignCatalogSort = (typeof DESIGN_CATALOG_SORT_OPTIONS)[number];

export function parseDesignCatalogSort(
  value: string | null | undefined,
): DesignCatalogSort {
  if (
    value &&
    (DESIGN_CATALOG_SORT_OPTIONS as readonly string[]).includes(value)
  ) {
    return value as DesignCatalogSort;
  }
  return 'featured';
}

export type DesignCatalogListItem =
  | { kind: 'couple-pack'; pack: CouplePackTemplate }
  | { kind: 'design'; entry: ProductDesignCatalogEntry };

function designSortName(
  design: ProductDesignTemplate,
  locale: 'mk' | 'en',
  translateName: (key: string) => string,
): string {
  return resolveProductDesignDisplayName(design, locale, translateName);
}

function designSortPrice(
  entry: ProductDesignCatalogEntry,
  colorFilter: string | 'all',
): number {
  const { product } = resolveDesignProduct(entry, colorFilter);
  return getProductDisplayPrice(product);
}

function packSortName(pack: CouplePackTemplate, locale: 'mk' | 'en'): string {
  return locale === 'mk' ? pack.titleMk : pack.titleEn;
}

export function sortDesignCatalogItems(
  items: DesignCatalogListItem[],
  sort: DesignCatalogSort,
  options: {
    locale: 'mk' | 'en';
    colorFilter: string | 'all';
    translateName: (key: string) => string;
  },
): DesignCatalogListItem[] {
  if (sort === 'featured') return items;

  const decorated = items.map((item, index) => {
    if (item.kind === 'couple-pack') {
      return {
        item,
        index,
        name: packSortName(item.pack, options.locale),
        price: Number.POSITIVE_INFINITY,
      };
    }

    return {
      item,
      index,
      name: designSortName(
        item.entry.design,
        options.locale,
        options.translateName,
      ),
      price: designSortPrice(item.entry, options.colorFilter),
    };
  });

  decorated.sort((a, b) => {
    if (sort === 'name-asc' || sort === 'name-desc') {
      const cmp = a.name.localeCompare(b.name, options.locale, {
        sensitivity: 'base',
      });
      if (cmp !== 0) return sort === 'name-asc' ? cmp : -cmp;
      return a.index - b.index;
    }

    const priceCmp = a.price - b.price;
    if (priceCmp !== 0) {
      return sort === 'price-asc' ? priceCmp : -priceCmp;
    }
    return a.index - b.index;
  });

  return decorated.map(({ item }) => item);
}

export function sortDesignCatalogEntries(
  entries: ProductDesignCatalogEntry[],
  sort: DesignCatalogSort,
  options: {
    locale: 'mk' | 'en';
    colorFilter: string | 'all';
    translateName: (key: string) => string;
  },
): ProductDesignCatalogEntry[] {
  const items = sortDesignCatalogItems(
    entries.map((entry) => ({ kind: 'design' as const, entry })),
    sort,
    options,
  );
  return items
    .filter((item): item is { kind: 'design'; entry: ProductDesignCatalogEntry } =>
      item.kind === 'design',
    )
    .map((item) => item.entry);
}
