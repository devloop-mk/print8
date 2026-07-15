'use client';

import { useMemo } from 'react';
import {
  getProductMockup,
  products,
  type Product,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import {
  getDesignCompositeOverlayUrl,
  normalizeHex,
  resolveOverlayPlacement,
} from '@/lib/products/design-overlay';
import { resolveDesignProduct } from '@/lib/products/garment-fit';
import {
  getMockupImageDisplayStyle,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';
import { resolveAssetUrl } from '@/lib/storage/asset-url';

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
  const placement = resolveOverlayPlacement(design, product);
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
            className="pointer-events-none absolute z-[2] object-contain"
            style={{
              left: `${placement.position.x}%`,
              top: `${placement.position.y}%`,
              width: `${placement.scale}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function resolveAdminPreviewProduct(
  template: ProductDesignTemplate,
): Product | null {
  if (template.productTypes.includes('t-shirt')) {
    try {
      return resolveDesignProduct(template);
    } catch {
      // Fall through to linked-product lookup.
    }
  }

  const linked = products.filter(
    (product) =>
      template.productTypes.includes(product.type) &&
      (!template.productIds?.length ||
        template.productIds.includes(product.id)),
  );

  return (
    linked.find((product) => product.type === 't-shirt') ??
    products.find((product) => product.id === 'tshirt-basic-white') ??
    linked[0] ??
    null
  );
}
