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
  getTshirtUnitPrice,
  isTshirtProduct,
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

export function getPremadeTshirtPrintPackage(
  design: ProductDesignTemplate,
): TshirtPrintPackage {
  const sides = getDesignSides(design);
  // Premade dual designs have no measured footprint — keep the former
  // flat dual price (700) via the large+large tier.
  return sides.includes('back') ? 'front-large-back-large' : 'front-small';
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
