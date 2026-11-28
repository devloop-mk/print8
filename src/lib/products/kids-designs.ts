import {
  getProductDesignCatalogEntries,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import {
  designResolvesToProduct,
  getTshirtProductForFit,
} from '@/lib/products/garment-fit';
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
  const kidsTee = getTshirtProductForFit('kids');
  return entries.filter((entry) => {
    const kidsDesign =
      isKidsDesignCollection(entry.design.collection) ||
      entry.design.applicableFits?.includes('kids');
    if (!kidsDesign || !kidsTee) return false;
    // This page is the kids t-shirt catalog. A design that opens as a mug,
    // bodysuit-only blank, or adult fit does not belong on these cards.
    return designResolvesToProduct(entry.design, kidsTee);
  });
}

export function getKidsDesignCatalogEntries(
  initialEntries?: ProductDesignCatalogEntry[],
): ProductDesignCatalogEntry[] {
  const source =
    initialEntries ?? getProductDesignCatalogEntries('image-designs');
  return filterKidsDesignCatalogEntries(source);
}
