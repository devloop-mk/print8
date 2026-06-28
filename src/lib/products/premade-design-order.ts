import {
  getProductMockup,
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  isTextDesignTemplate,
  type Product,
  type ProductDesignTemplate,
  type ProductSide,
} from '@/lib/data/catalog';
import type { CartItem } from '@/components/cart/CartProvider';
import {
  sideDesignFromImageTemplate,
  sideDesignFromOverlayTemplate,
  sideDesignFromTextTemplate,
  type SideDesign,
} from '@/lib/products/design-state';
import { getSideMetadataPrefix } from '@/lib/products/product-sides';
import { serializePlacedStickers } from '@/lib/products/sticker-library';

function writeSideDesignMetadata(
  metadata: Record<string, string | number | boolean>,
  side: ProductSide,
  design: SideDesign,
) {
  const prefix = getSideMetadataPrefix(side);

  metadata[`${prefix}CustomText`] = design.customText;
  metadata[`${prefix}CustomTextColor`] = design.customTextColor;
  metadata[`${prefix}CustomTextSize`] = design.customTextSize;
  metadata[`${prefix}CustomTextPositionX`] = design.customTextPosition.x;
  metadata[`${prefix}CustomTextPositionY`] = design.customTextPosition.y;
  metadata[`${prefix}CustomTextFontWeight`] = design.customTextFontWeight;
  metadata[`${prefix}CustomTextLetterSpacing`] = design.customTextLetterSpacing;
  metadata[`${prefix}CustomTextLineHeight`] = design.customTextLineHeight;
  metadata[`${prefix}CustomTextShadow`] = design.customTextShadow;
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

function sideDesignForTemplate(
  design: ProductDesignTemplate,
  product: Product,
  color: string,
): SideDesign | null {
  if (isImageDesignTemplate(design)) {
    return sideDesignFromImageTemplate(design);
  }
  if (isOverlayDesignTemplate(design)) {
    return sideDesignFromOverlayTemplate(design, product, color);
  }
  if (isTextDesignTemplate(design)) {
    return sideDesignFromTextTemplate(design);
  }
  return null;
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
  const side = design.defaultSide;
  const sideDesign = sideDesignForTemplate(design, product, color);

  const metadata: Record<string, string | number | boolean> = {
    productId: product.id,
    color,
    designTemplateId: design.id,
    designKind: design.kind,
    designSide: side,
    activeSide: side,
    isCustomized: Boolean(sideDesign),
  };

  if (size) metadata.size = size;

  if (sideDesign) {
    writeSideDesignMetadata(metadata, side, sideDesign);
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
  price,
  quantity = 1,
  capturedPreview,
}: {
  product: Product;
  design: ProductDesignTemplate;
  color: string;
  size?: string;
  name: string;
  price: number;
  quantity?: number;
  capturedPreview?: string;
}): Omit<CartItem, 'id'> {
  const metadata = buildPremadeDesignOrderMetadata({
    product,
    design,
    color,
    size,
  });
  const preview =
    capturedPreview ?? getPremadeDesignOrderPreview(product, design, color);
  const previewField = sidePreviewFieldForSide(design.defaultSide);

  return {
    type: 'product',
    name,
    price,
    quantity,
    metadata,
    [previewField]: preview,
  };
}
