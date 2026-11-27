import {
  products,
  type Product,
  type ProductDesignTemplate,
  type ProductType,
} from '@/lib/data/catalog';
import { christmasBabyPackTemplates } from '@/lib/data/christmas-baby-pack';
import { christmasGiftPackTemplates } from '@/lib/data/christmas-gift-pack';
import type { ProductDesignCatalogEntry } from '@/lib/products/design-catalog';

export const CHRISTMAS_BABY_COLLECTION = 'christmas-baby';
export const CHRISTMAS_GIFT_COLLECTION = 'christmas';
export const CHRISTMAS_BODYSUIT_PRODUCT_ID = 'bodysuit-basic';

const CHRISTMAS_GROUP_ORDER: readonly ProductType[] = [
  'bodysuit',
  'hoodie',
  'mug',
  'bag',
];

/**
 * Homepage mix: four bodysuits, two hoodies, one mug, one bag.
 * Each id is locked to that product in the catalog.
 */
export const CHRISTMAS_HOME_FEATURED_IDS = [
  'baby-xmas-first',
  'baby-xmas-lara',
  'baby-xmas-santa-baby',
  'baby-xmas-jingle',
  'xmas-hoodie-2027',
  'xmas-hoodie-happy',
  'xmas-mug-nina',
  'xmas-bag-jana',
] as const;

export function getChristmasDesignTemplates(): readonly ProductDesignTemplate[] {
  return [...christmasBabyPackTemplates, ...christmasGiftPackTemplates];
}

function productForDesign(design: ProductDesignTemplate): Product | undefined {
  const lockedId = design.productIds?.[0];
  if (lockedId) {
    const locked = products.find((product) => product.id === lockedId);
    if (locked) return locked;
  }
  const type = design.productTypes[0];
  return products.find((product) => product.type === type);
}

export function getChristmasCatalogEntries(): ProductDesignCatalogEntry[] {
  return getChristmasDesignTemplates().flatMap((design) => {
    const product = productForDesign(design);
    if (!product) return [];
    return [{ design, products: [product] }];
  });
}

export type ChristmasShowcaseItem = {
  design: ProductDesignTemplate;
  product: Product;
};

export function getChristmasHomeShowcase(): ChristmasShowcaseItem[] {
  const byId = new Map(
    getChristmasCatalogEntries().map((entry) => [entry.design.id, entry]),
  );
  return CHRISTMAS_HOME_FEATURED_IDS.flatMap((id) => {
    const entry = byId.get(id);
    const product = entry?.products[0];
    if (!entry || !product) return [];
    return [{ design: entry.design, product }];
  });
}

export function groupChristmasCatalogEntries(
  entries: ProductDesignCatalogEntry[],
): { type: ProductType; entries: ProductDesignCatalogEntry[] }[] {
  return CHRISTMAS_GROUP_ORDER.flatMap((type) => {
    const group = entries.filter((entry) => entry.design.productTypes[0] === type);
    if (group.length === 0) return [];
    return [{ type, entries: group }];
  });
}
