'use client';

import { useMemo } from 'react';
import {
  getProductMockup,
  products,
  type Product,
  type ProductDesignTemplate,
  type ProductType,
  type GarmentFit,
} from '@/lib/data/catalog';
import {
  DESIGN_OVERLAY_LAYER_CLASS,
  getDesignCompositeOverlayUrl,
  getDesignOverlayLayerStyle,
  normalizeHex,
  resolveOverlayPlacementForSide,
} from '@/lib/products/design-overlay';
import {
  getDesignApplicableFits,
  getDesignPrimaryProductType,
  resolveTshirtProductForDesign,
} from '@/lib/products/garment-fit';
import { premadeDesignAppliesToProduct } from '@/lib/products/premade-design-product-match';
import { resolveProductId } from '@/lib/products/product-id-aliases';
import {
  getMockupImageDisplayStyle,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';
import { resolveAssetUrl } from '@/lib/storage/asset-url';

const PREVIEW_PRODUCT_BY_TYPE: Partial<Record<ProductType, string>> = {
  cup: 'cup-glass-beer',
  mug: 'mug-classic',
  thermos: 'thermos-classic',
  't-shirt': 'tshirt-unisex',
  hoodie: 'hoodie-basic',
  cap: 'cap-classic',
  bag: 'bag-tote',
  bodysuit: 'bodysuit-basic',
};

function getAdminOverlayUrl(
  design: ProductDesignTemplate,
): string | null {
  return (
    getDesignCompositeOverlayUrl(design) ??
    (design.overlayImage ? resolveAssetUrl(design.overlayImage) : null) ??
    (design.overlaySvg ? resolveAssetUrl(design.overlaySvg) : null)
  );
}

/** Shirt mockup + design overlay for admin color matrix (ignores applicableColors). */
export function AdminDesignColorPreview({
  product,
  design,
  color,
}: {
  product: Product;
  design: ProductDesignTemplate;
  color: string;
}) {
  const shirtColor = normalizeHex(color);
  const mockupSide = design.defaultSide ?? 'front';
  const shirtMockup = getProductMockup(product, shirtColor, mockupSide);
  const placement = resolveOverlayPlacementForSide(design, mockupSide, product);
  const overlaySrc = useMemo(() => getAdminOverlayUrl(design), [design]);
  const mockupLayout = getProductMockupLayout(product);
  const mockupStyle = getMockupImageDisplayStyle(
    product,
    shirtMockup,
    'catalog-design',
  );

  return (
    <div className="relative aspect-square w-full overflow-hidden bg-white">
      <div
        className={`${mockupLayout.catalogInnerClass} relative h-full w-full`}
        style={mockupStyle}
      >
        {shirtMockup ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${shirtColor}-${shirtMockup}`}
            src={shirtMockup}
            alt=""
            draggable={false}
            className={mockupLayout.catalogImageClass}
          />
        ) : null}
        {overlaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${shirtColor}-${overlaySrc}`}
            src={overlaySrc}
            alt=""
            draggable={false}
            className={DESIGN_OVERLAY_LAYER_CLASS}
            style={getDesignOverlayLayerStyle(placement)}
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Product used for admin color-matrix mockups.
 * Prefers productTypes[0] (e.g. bodysuit for baby milestones), not t-shirt.
 */
export function resolveAdminPreviewProduct(
  template: ProductDesignTemplate,
  productType?: ProductType,
  garmentFit?: GarmentFit,
): Product | null {
  const type =
    productType && template.productTypes.includes(productType)
      ? productType
      : (template.productTypes[0] ?? getDesignPrimaryProductType(template));

  if (type === 't-shirt') {
    try {
      const fits = getDesignApplicableFits(template);
      const fit =
        garmentFit && fits.includes(garmentFit)
          ? garmentFit
          : (fits[0] ?? 'unisex');
      return resolveTshirtProductForDesign(template, fit);
    } catch {
      // Fall through to linked-product lookup.
    }
  }

  if (template.productIds?.length) {
    const byId = template.productIds
      .map((id) =>
        products.find((product) => product.id === resolveProductId(id)),
      )
      .find((product) => product?.type === type);
    if (byId) return byId;
  }

  const preferredId = PREVIEW_PRODUCT_BY_TYPE[type];
  if (preferredId) {
    const preferred = products.find(
      (product) => product.id === resolveProductId(preferredId),
    );
    if (preferred) return preferred;
  }

  const linked = products.filter(
    (product) =>
      product.type === type && premadeDesignAppliesToProduct(template, product),
  );

  return linked[0] ?? products.find((product) => product.type === type) ?? null;
}
