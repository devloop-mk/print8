import {
  getProductMockup,
  isImageDesignTemplate,
  type Product,
  type ProductDesignTemplate,
  type ProductSide,
} from '@/lib/data/catalog';
import type { CartItem } from '@/lib/cart/types';
import {
  sideDesignsFromTemplate,
  type SideDesign,
} from '@/lib/products/design-state';
import {
  getDesignSides,
  getInitialCustomizerSide,
} from '@/lib/products/design-sides';
import { getSideMetadataPrefix } from '@/lib/products/product-sides';
import { serializePlacedStickers } from '@/lib/products/sticker-library';
import { writeTextMetadata } from '@/lib/products/text-layers';
import {
  resolveOverlayPlacementForSide,
} from '@/lib/products/design-overlay';
import {
  deriveTshirtPrintPackage,
  getTshirtUnitPrice,
  isTshirtProduct,
  type TshirtContentFootprint,
  type TshirtPrintPackage,
} from '@/lib/products/tshirt-print-pricing';

export function writeSideDesignMetadata(
  metadata: Record<string, string | number | boolean>,
  side: ProductSide,
  design: SideDesign,
) {
  const prefix = getSideMetadataPrefix(side);

  writeTextMetadata(metadata, prefix, design);
  metadata[`${prefix}IsTextTemplate`] = design.isTextTemplate;
  metadata[`${prefix}UploadedImageScale`] = design.uploadedImageScale;
  metadata[`${prefix}UploadedImagePositionX`] = design.uploadedImagePosition.x;
  metadata[`${prefix}UploadedImagePositionY`] = design.uploadedImagePosition.y;

  if (design.premadeDesignImage) {
    metadata[`${prefix}PremadeDesignImage`] = design.premadeDesignImage;
  }
  if (design.premadeDesignId) {
    metadata[`${prefix}PremadeDesignId`] = design.premadeDesignId;
  }
  if (design.isRecolorableOverlay) {
    metadata[`${prefix}IsRecolorableOverlay`] = true;
    if (design.overlaySvg) metadata[`${prefix}OverlaySvg`] = design.overlaySvg;
    if (design.overlaySvgColors?.primary) {
      metadata[`${prefix}OverlaySvgPrimary`] = design.overlaySvgColors.primary;
    }
    if (design.overlaySvgColors?.secondary) {
      metadata[`${prefix}OverlaySvgSecondary`] =
        design.overlaySvgColors.secondary;
    }
  }
  if (design.overlayColorVariants) {
    metadata[`${prefix}HasOverlayVariants`] = true;
  }
  if (design.overlayRaster) {
    metadata[`${prefix}OverlayRaster`] = design.overlayRaster;
  }
  if (design.uploadedFile?.fileId) {
    metadata[`${prefix}UploadedFileId`] = design.uploadedFile.fileId;
  }
  if (design.uploadedFile?.previewUrl) {
    metadata[`${prefix}UploadedPreviewUrl`] = design.uploadedFile.previewUrl;
  }
  if (design.stickers.length > 0) {
    metadata[`${prefix}Stickers`] = serializePlacedStickers(design.stickers);
  }
}

/**
 * Approximate on-mockup footprint for a premade side from stored overlay
 * scale (width %). Uses a square box so tall art is not under-priced as
 * "small". Missing scale → null → derive treats that side as large.
 */
function premadeSideFootprint(
  design: ProductDesignTemplate,
  side: ProductSide,
): TshirtContentFootprint | null {
  if (!getDesignSides(design).includes(side)) return null;

  if (design.kind === 'text' && side === design.defaultSide) {
    const scale =
      design.textStyle?.photoScale ?? design.textStyle?.textSize ?? null;
    if (scale == null) return null;
    return { width: scale, height: scale };
  }

  const placement = resolveOverlayPlacementForSide(design, side, 't-shirt');
  return { width: placement.scale, height: placement.scale };
}

/**
 * Auto print package for ready-made tee designs (no live DOM measure).
 * Classifies each side via overlay/photo scale vs the small chest zone —
 * same thresholds as the customizer's footprintFitsSmallZone.
 */
export function getPremadeTshirtPrintPackage(
  design: ProductDesignTemplate,
): TshirtPrintPackage {
  const sides = getDesignSides(design);
  const hasFront = sides.includes('front');
  const hasBack = sides.includes('back');

  return deriveTshirtPrintPackage({
    hasFrontContent: hasFront,
    hasBackContent: hasBack,
    frontFootprint: hasFront ? premadeSideFootprint(design, 'front') : null,
    backFootprint: hasBack ? premadeSideFootprint(design, 'back') : null,
  });
}

export function getPremadeDesignUnitPrice(
  product: Product,
  design: ProductDesignTemplate,
): number {
  if (!isTshirtProduct(product)) return product.basePrice;
  return getTshirtUnitPrice(getPremadeTshirtPrintPackage(design));
}

export function buildPremadeDesignOrderMetadata({
  product,
  design,
  color,
  size,
}: {
  product: Product;
  design: ProductDesignTemplate;
  color: string;
  size?: string;
}): Record<string, string | number | boolean> {
  const sides = getDesignSides(design);
  const activeSide = getInitialCustomizerSide(design);
  const sideDesignMap = sideDesignsFromTemplate(design, product, color);

  const metadata: Record<string, string | number | boolean> = {
    productId: product.id,
    color,
    designTemplateId: design.id,
    designKind: design.kind,
    designSide: activeSide,
    activeSide,
    isCustomized: Object.keys(sideDesignMap).length > 0,
  };

  if (isTshirtProduct(product)) {
    metadata.printPackage = getPremadeTshirtPrintPackage(design);
  }

  if (sides.length > 1) {
    metadata.designSides = sides.join(',');
  }

  if (size) metadata.size = size;

  for (const side of sides) {
    const sideDesign = sideDesignMap[side];
    if (sideDesign) {
      writeSideDesignMetadata(metadata, side, sideDesign);
    }
  }

  return metadata;
}

export function getPremadeDesignOrderPreview(
  product: Product,
  design: ProductDesignTemplate,
  color: string,
): string {
  if (isImageDesignTemplate(design) && design.image) {
    return design.image;
  }

  return (
    getProductMockup(product, color, design.defaultSide) ?? product.image
  );
}

function sidePreviewFieldForSide(
  side: ProductSide,
): keyof Pick<
  CartItem,
  'designPreview' | 'backDesignPreview' | 'leftDesignPreview' | 'rightDesignPreview'
> {
  switch (side) {
    case 'back':
      return 'backDesignPreview';
    case 'left':
      return 'leftDesignPreview';
    case 'right':
      return 'rightDesignPreview';
    default:
      return 'designPreview';
  }
}

export function buildPremadeDesignCartPayload({
  product,
  design,
  color,
  size,
  name,
  quantity = 1,
  capturedPreview,
}: {
  product: Product;
  design: ProductDesignTemplate;
  color: string;
  size?: string;
  name: string;
  /** @deprecated Ignored — unit price is derived from product + print package. */
  price?: number;
  quantity?: number;
  capturedPreview?: string;
}): Omit<CartItem, 'id'> {
  const metadata = buildPremadeDesignOrderMetadata({
    product,
    design,
    color,
    size,
  });
  const activeSide = getInitialCustomizerSide(design);
  const preview =
    capturedPreview ?? getPremadeDesignOrderPreview(product, design, color);
  const previewField = sidePreviewFieldForSide(activeSide);
  const sides = getDesignSides(design);
  const backPreview =
    sides.includes('back') && activeSide !== 'back'
      ? getProductMockup(product, color, 'back') ?? undefined
      : undefined;
  const unitPrice = getPremadeDesignUnitPrice(product, design);

  return {
    type: 'product',
    name,
    price: unitPrice,
    quantity,
    metadata,
    [previewField]: preview,
    ...(backPreview ? { backDesignPreview: backPreview } : {}),
  };
}
