import type { CouplePackTemplate } from '@/lib/data/couple-pack';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import {
  resolveDesignProduct,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import {
  resolveProductDesignDisplayName,
  type ProductDesignNameTranslator,
} from '@/lib/products/design-display-name';
import { getProductDisplayPrice } from '@/lib/products/tshirt-print-pricing';

export const DESIGN_CATALOG_SORT_OPTIONS = [
  'date-desc',
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
  return 'date-desc';
}

export type DesignCatalogListItem =
  | { kind: 'couple-pack'; pack: CouplePackTemplate }
  | { kind: 'design'; entry: ProductDesignCatalogEntry };

function designSortName(
  design: ProductDesignTemplate,
  locale: 'mk' | 'en',
  translateName: ProductDesignNameTranslator,
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

function designSortAddedAt(design: ProductDesignTemplate): number | null {
  const raw = design.catalogAddedAt;
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function compareAddedAt(
  a: number | null,
  b: number | null,
  descending: boolean,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  const cmp = a - b;
  return descending ? -cmp : cmp;
}

export function sortDesignCatalogItems(
  items: DesignCatalogListItem[],
  sort: DesignCatalogSort,
  options: {
    locale: 'mk' | 'en';
    colorFilter: string | 'all';
    translateName: ProductDesignNameTranslator;
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
        addedAt: null as number | null,
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
      addedAt: designSortAddedAt(item.entry.design),
    };
  });

  decorated.sort((a, b) => {
    if (sort === 'date-desc') {
      const dateCmp = compareAddedAt(a.addedAt, b.addedAt, true);
      if (dateCmp !== 0) return dateCmp;
      return a.index - b.index;
    }

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
    translateName: ProductDesignNameTranslator;
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
