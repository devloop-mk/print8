import {
  getProductDesignTemplates,
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  type Product,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { isMugInsideProduct } from '@/lib/products/drinkware-product-options';
import { getDrinkwareSublimationPatch } from '@/lib/products/drinkware-sublimation-patch';
import { premadeDesignAppliesToProduct } from '@/lib/products/premade-design-product-match';

export type CatalogYourDesignPlaceholder = {
  x: number;
  y: number;
  /** Overlay sits on a light print field (e.g. white patch) — use dark type. */
  onLightSurface?: boolean;
  /** Shrink type so it stays inside a small print window. */
  compact?: boolean;
};

/**
 * Catalog-card “your design here” placement on the product photo.
 * `null` = hide — the photo is not the printable surface.
 */
const CATALOG_YOUR_DESIGN_PLACEHOLDER: Record<
  string,
  CatalogYourDesignPlaceholder
> = {
  // White sublimation window, handle on the right.
  'mug-red-patch': { x: 41, y: 52, onLightSurface: true, compact: true },
  'mug-window-blue': { x: 41, y: 52, onLightSurface: true, compact: true },
  // Handle on the left — printable wall is the facing body, not the handle.
  'mug-magic-glossy': { x: 56, y: 48 },
  // Two-mug supplier photo — upright mug is on the right.
  'mug-magic-matte': { x: 60, y: 47 },
  // Full-zip — print sits on the left chest, clear of the zipper and pockets.
  'hoodie-full-zip': { x: 42, y: 44, compact: true },
};

export function getCatalogYourDesignPlaceholder(
  product: Product,
): CatalogYourDesignPlaceholder | null {
  // Top-down interior photos: the bowl is factory-printed; exterior is customized.
  if (isMugInsideProduct(product.id)) return null;

  if (CATALOG_YOUR_DESIGN_PLACEHOLDER[product.id]) {
    return CATALOG_YOUR_DESIGN_PLACEHOLDER[product.id];
  }

  if (getDrinkwareSublimationPatch(product.id)) {
    return { x: 36, y: 51, onLightSurface: true, compact: true };
  }

  return null;
}

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
