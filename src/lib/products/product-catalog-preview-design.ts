import {
  getProductDesignTemplates,
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  type Product,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { isMugInsideProduct } from '@/lib/products/drinkware-product-options';
import { premadeDesignAppliesToProduct } from '@/lib/products/premade-design-product-match';

/** Catalog cards use product photos; skip overlay previews when a design on the photo would mislead. */
export function shouldShowProductCatalogDesignPreview(product: Product): boolean {
  // Interior-message mugs use top-down catalog photos — exterior overlays look wrong.
  if (isMugInsideProduct(product.id)) return false;
  return true;
}

/** Pick a sample premade design for product card hover / catalog preview. */
export function pickProductCatalogPreviewDesign(
  product: Product,
  templates?: ProductDesignTemplate[],
): ProductDesignTemplate | null {
  if (!shouldShowProductCatalogDesignPreview(product)) return null;

  const pool =
    templates && templates.length > 0
      ? templates
      : getProductDesignTemplates(product);
  const applicable = pool.filter((design) =>
    premadeDesignAppliesToProduct(design, product),
  );
  if (applicable.length === 0) return null;

  const visual = applicable.filter(
    (design) =>
      isOverlayDesignTemplate(design) || isImageDesignTemplate(design),
  );
  const candidates = visual.length > 0 ? visual : applicable;

  let hash = 0;
  for (let i = 0; i < product.id.length; i += 1) {
    hash = (hash * 31 + product.id.charCodeAt(i)) >>> 0;
  }
  return candidates[hash % candidates.length];
}
