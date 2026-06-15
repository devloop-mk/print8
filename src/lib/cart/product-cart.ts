import {
  products,
  getProductMockup,
  type Product,
  type ProductSide,
  type ProductType,
} from "@/lib/data/catalog";
import type { CartItem } from "@/components/cart/CartProvider";

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
      m.frontPremadeDesignImage ||
      m.backPremadeDesignImage ||
      m.frontUploadedPreviewUrl ||
      m.backUploadedPreviewUrl,
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
  frontLabel: string,
  backLabel: string,
): { src: string; label?: string }[] {
  const images: { src: string; label?: string }[] = [];
  if (item.designPreview) {
    images.push({ src: item.designPreview, label: frontLabel });
  }
  if (item.backDesignPreview) {
    images.push({ src: item.backDesignPreview, label: backLabel });
  }

  if (images.length === 0) {
    const product = getCartItemProduct(item);
    const color = getCartItemColor(item) ?? product?.colors?.[0] ?? "#ffffff";
    if (product) {
      const front = getProductMockup(product, color, "front");
      if (front) images.push({ src: front, label: frontLabel });
      if (product.sides?.includes("back")) {
        const back = getProductMockup(product, color, "back");
        if (back && back !== front) {
          images.push({ src: back, label: backLabel });
        }
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
  const prefix = side === "front" ? "front" : "back";
  const hasContent =
    metadata[`${prefix}CustomText`] ||
    metadata[`${prefix}PremadeDesignImage`] ||
    metadata[`${prefix}UploadedPreviewUrl`] ||
    metadata[`${prefix}UploadedFileId`];

  if (!hasContent) return null;

  const isTextTemplate = metadata[`${prefix}IsTextTemplate`] === true;

  return {
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
    isTextTemplate,
    uploadedImageScale: num(metadata[`${prefix}UploadedImageScale`], 40),
    uploadedImagePosition: {
      x: num(metadata[`${prefix}UploadedImagePositionX`], 50),
      y: num(metadata[`${prefix}UploadedImagePositionY`], 48),
    },
    premadeDesignImage: str(metadata[`${prefix}PremadeDesignImage`]) || null,
    premadeDesignId: str(metadata[`${prefix}PremadeDesignId`]) || null,
    uploadedFileId: str(metadata[`${prefix}UploadedFileId`]) || null,
    uploadedPreviewUrl: str(metadata[`${prefix}UploadedPreviewUrl`]) || null,
    showPhotoGuide: false,
  };
}

export function getProductTypeFromItem(item: CartItem): ProductType | null {
  const product = getCartItemProduct(item);
  return product?.type ?? null;
}
