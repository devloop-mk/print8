import {
  products,
  getProductMockup,
  getProductSides,
  getMagnetDisplayMockup,
  type Product,
  type ProductSide,
  type ProductType,
} from "@/lib/data/catalog";
import type { CartItem } from "@/lib/cart/types";
import {
  getSideMetadataPrefix,
  getSidePreviewFromCartItem,
  SIDE_PREVIEW_CART_KEYS,
} from "@/lib/products/product-sides";
import { isCylindricalDrinkwareType } from "@/lib/products/product-mockup-layout";

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function formatProductCartName(
  typeLabel: string,
  size?: string,
  product?: Product,
): string {
  if (product?.sizes?.length && size) {
    return `${typeLabel} (${size})`;
  }
  return typeLabel;
}

export function isCustomizedCartItem(item: CartItem): boolean {
  if (item.fileIds?.length) return true;
  const m = item.metadata;
  if (!m) return false;
  if (m.isCustomized) return true;
  return Boolean(
    m.frontCustomText ||
      m.backCustomText ||
      m.leftCustomText ||
      m.rightCustomText ||
      m.frontPremadeDesignImage ||
      m.backPremadeDesignImage ||
      m.leftPremadeDesignImage ||
      m.rightPremadeDesignImage ||
      m.frontUploadedPreviewUrl ||
      m.backUploadedPreviewUrl ||
      m.leftUploadedPreviewUrl ||
      m.rightUploadedPreviewUrl ||
      m.frontStickers ||
      m.backStickers ||
      m.leftStickers ||
      m.rightStickers ||
      m.frontTextLayers ||
      m.backTextLayers ||
      m.leftTextLayers ||
      m.rightTextLayers,
  );
}

export function getCartItemColor(item: CartItem): string | undefined {
  const color = item.metadata?.color;
  return typeof color === "string" ? color : undefined;
}

export function getCartItemSize(item: CartItem): string | undefined {
  const size = item.metadata?.size;
  return typeof size === "string" ? size : undefined;
}

export function getCartItemProduct(item: CartItem): Product | undefined {
  const productId = item.metadata?.productId;
  if (typeof productId !== "string") return undefined;
  return getProductById(productId);
}

export function getCartItemPreviewImages(
  item: CartItem,
  labels: Partial<Record<ProductSide, string>> & {
    magnet?: string;
    upload?: string;
  },
): { src: string; label?: string }[] {
  const product = getCartItemProduct(item);

  if (product?.type === 'magnet') {
    const color = getCartItemColor(item) ?? product.colors?.[0] ?? '#ffffff';
    const mockup = getMagnetDisplayMockup(product, color);
    const upload =
      typeof item.metadata?.frontUploadedPreviewUrl === 'string'
        ? item.metadata.frontUploadedPreviewUrl
        : undefined;

    const images: { src: string; label?: string }[] = [];
    if (mockup) {
      images.push({ src: mockup, label: labels.magnet });
    }
    if (upload) {
      images.push({ src: upload, label: labels.upload });
    }
    if (images.length > 0) return images;
  }

  // Drinkware 3D cart snapshots use left/right profile views (not front/back).
  if (product && isCylindricalDrinkwareType(product.type)) {
    const left = getSidePreviewFromCartItem(item, 'left');
    const right = getSidePreviewFromCartItem(item, 'right');
    if (left || right) {
      const images: { src: string; label?: string }[] = [];
      if (left) images.push({ src: left, label: labels.left });
      if (right) images.push({ src: right, label: labels.right });
      if (images.length > 0) return images;
    }
    // Legacy dual snapshots stored as front/back before the left/right switch.
    const legacyFront = getSidePreviewFromCartItem(item, 'front');
    const legacyBack = getSidePreviewFromCartItem(item, 'back');
    if (legacyFront && legacyBack) {
      return [
        { src: legacyFront, label: labels.left },
        { src: legacyBack, label: labels.right },
      ];
    }
  }

  const images: { src: string; label?: string }[] = [];

  for (const side of Object.keys(SIDE_PREVIEW_CART_KEYS) as ProductSide[]) {
    const src = getSidePreviewFromCartItem(item, side);
    if (src) {
      images.push({ src, label: labels[side] });
    }
  }

  if (images.length === 0) {
    const product = getCartItemProduct(item);
    const color = getCartItemColor(item) ?? product?.colors?.[0] ?? "#ffffff";
    if (product) {
      for (const side of getProductSides(product)) {
        const src = getProductMockup(product, color, side);
        if (!src) continue;
        if (images.some((image) => image.src === src)) continue;
        images.push({ src, label: labels[side] });
      }
    }
  }

  return images;
}

export function buildCustomizerEditUrl(item: CartItem): string | null {
  const product = getCartItemProduct(item);
  if (!product || !isCustomizedCartItem(item)) return null;
  const params = new URLSearchParams({ id: product.id, edit: item.id });
  const designId = item.metadata?.designTemplateId;
  if (typeof designId === "string") params.set("design", designId);
  return `/products/customize/${product.type}?${params.toString()}`;
}

import {
  DEFAULT_TEXT_SHADOW,
  type RestoredSideDesign,
} from "@/lib/products/design-state";
import { parsePlacedStickers } from "@/lib/products/sticker-library";
import { parseTextLayersFromMetadata } from "@/lib/products/text-layers";

function num(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function restoreSideDesignFromMetadata(
  metadata: Record<string, string | number | boolean>,
  side: ProductSide,
): RestoredSideDesign | null {
  const prefix = getSideMetadataPrefix(side);
  const stickers = parsePlacedStickers(metadata[`${prefix}Stickers`]);
  const flatText = {
    customText: str(metadata[`${prefix}CustomText`]),
    customTextColor: str(metadata[`${prefix}CustomTextColor`], "#1e3a5f"),
    customTextSize: num(metadata[`${prefix}CustomTextSize`], 18),
    customTextPosition: {
      x: num(metadata[`${prefix}CustomTextPositionX`], 50),
      y: num(metadata[`${prefix}CustomTextPositionY`], 25),
    },
    customTextFontWeight: num(metadata[`${prefix}CustomTextFontWeight`], 700),
    customTextLetterSpacing: str(
      metadata[`${prefix}CustomTextLetterSpacing`],
      "0.02em",
    ),
    customTextLineHeight: num(metadata[`${prefix}CustomTextLineHeight`], 1.2),
    customTextShadow: str(
      metadata[`${prefix}CustomTextShadow`],
      DEFAULT_TEXT_SHADOW,
    ),
  };
  const textLayers = parseTextLayersFromMetadata(metadata, prefix, flatText);
  const hasContent =
    textLayers.length > 0 ||
    metadata[`${prefix}CustomText`] ||
    metadata[`${prefix}PremadeDesignImage`] ||
    metadata[`${prefix}UploadedPreviewUrl`] ||
    metadata[`${prefix}UploadedFileId`] ||
    metadata[`${prefix}OverlaySvg`] ||
    metadata[`${prefix}HasOverlayVariants`] ||
    metadata[`${prefix}OverlayRaster`] ||
    stickers.length > 0;

  if (!hasContent) return null;

  const isTextTemplate = metadata[`${prefix}IsTextTemplate`] === true;
  const isRecolorableOverlay =
    metadata[`${prefix}IsRecolorableOverlay`] === true;

  return {
    customText: flatText.customText,
    customTextColor: flatText.customTextColor,
    customTextSize: flatText.customTextSize,
    customTextPosition: flatText.customTextPosition,
    customTextFontWeight: flatText.customTextFontWeight,
    customTextLetterSpacing: flatText.customTextLetterSpacing,
    customTextLineHeight: flatText.customTextLineHeight,
    customTextShadow: flatText.customTextShadow,
    textLayers,
    isTextTemplate,
    uploadedImageScale: num(metadata[`${prefix}UploadedImageScale`], 40),
    uploadedImagePosition: {
      x: num(metadata[`${prefix}UploadedImagePositionX`], 50),
      y: num(metadata[`${prefix}UploadedImagePositionY`], 48),
    },
    premadeDesignImage: str(metadata[`${prefix}PremadeDesignImage`]) || null,
    premadeDesignId: str(metadata[`${prefix}PremadeDesignId`]) || null,
    overlaySvg: str(metadata[`${prefix}OverlaySvg`]) || null,
    overlaySvgPrimary: str(metadata[`${prefix}OverlaySvgPrimary`]) || null,
    overlaySvgSecondary: str(metadata[`${prefix}OverlaySvgSecondary`]) || null,
    overlayColorVariants: null,
    overlayRaster: str(metadata[`${prefix}OverlayRaster`]) || null,
    isRecolorableOverlay,
    uploadedFileId: str(metadata[`${prefix}UploadedFileId`]) || null,
    uploadedPreviewUrl: str(metadata[`${prefix}UploadedPreviewUrl`]) || null,
    showPhotoGuide: false,
    stickers,
  };
}

export function getProductTypeFromItem(item: CartItem): ProductType | null {
  const product = getCartItemProduct(item);
  return product?.type ?? null;
}
