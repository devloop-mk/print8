import {
  getProductDesignCatalogEntries,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import { KIDS_DESIGN_COLLECTIONS } from '@/lib/products/paths';

export function isKidsDesignCollection(collection: string | undefined): boolean {
  return (
    collection != null &&
    (KIDS_DESIGN_COLLECTIONS as readonly string[]).includes(collection)
  );
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
