import type { Product, ProductDesignTemplate } from '@/lib/data/catalog';
import type { ProductDesignCatalogEntry } from '@/lib/products/design-catalog';

/**
 * Catalog cards / ISR props only need overlay (or image) URLs for previews.
 * Omit printMasterImage so we do not serialize private master asset paths into
 * every listing page payload.
 */
export function slimProductDesignForCatalogCard(
  design: ProductDesignTemplate,
): ProductDesignTemplate {
  const { printMasterImage: _omit, ...cardDesign } = design;
  return cardDesign;
}

/** Drop upload-only metadata unused by catalog cards. */
export function slimProductForCatalogCard(product: Product): Product {
  const { uploadAspect: _omit, ...cardProduct } = product;
  return cardProduct;
}

export function slimProductDesignCatalogEntry(
  entry: ProductDesignCatalogEntry,
): ProductDesignCatalogEntry {
  return {
    design: slimProductDesignForCatalogCard(entry.design),
    products: entry.products.map(slimProductForCatalogCard),
  };
}

export function slimProductDesignCatalogEntries(
  entries: ProductDesignCatalogEntry[],
): ProductDesignCatalogEntry[] {
  return entries.map(slimProductDesignCatalogEntry);
}

export function slimProductDesignMap(
  designs: Record<string, ProductDesignTemplate>,
): Record<string, ProductDesignTemplate> {
  const slim: Record<string, ProductDesignTemplate> = {};
  for (const [id, design] of Object.entries(designs)) {
    slim[id] = slimProductDesignForCatalogCard(design);
  }
  return slim;
}
