import {
  getProductDesignCatalogEntries,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import { KIDS_DESIGN_COLLECTION } from '@/lib/products/paths';

export function isKidsDesignCollection(collection: string | undefined): boolean {
  return collection === KIDS_DESIGN_COLLECTION;
}

export function filterKidsDesignCatalogEntries(
  entries: ProductDesignCatalogEntry[],
): ProductDesignCatalogEntry[] {
  return entries.filter((entry) =>
    isKidsDesignCollection(entry.design.collection),
  );
}

export function getKidsDesignCatalogEntries(
  initialEntries?: ProductDesignCatalogEntry[],
): ProductDesignCatalogEntry[] {
  const source =
    initialEntries ?? getProductDesignCatalogEntries('image-designs');
  return filterKidsDesignCatalogEntries(source);
}
