import type { CheckoutInput } from '@/lib/validations/order';
import {
  getMagnetDisplayMockup,
  getProductMockup,
  type ProductSide,
} from '@/lib/data/catalog';
import { getProductById } from '@/lib/cart/product-cart';
import {
  PRODUCT_SIDES,
  getSideMetadataPrefix,
  SIDE_PREVIEW_CART_KEYS,
} from '@/lib/products/product-sides';
import { parsePlacedPhotos } from '@/lib/products/photo-layers';
import { isUploadOnlyProduct } from '@/lib/products/upload-only-products';

export type OrderItem = CheckoutInput['items'][number];

const SIDE_LABELS: Record<ProductSide, string> = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
};

export function extractUploadedFileIdFromPreviewSrc(src: string): string | null {
  const trimmed = src.trim();
  if (!trimmed) return null;

  try {
    const url = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? new URL(trimmed)
      : new URL(trimmed, 'https://print8.local');
    const match = url.pathname.match(/^\/api\/files\/([^/]+)$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export function collectOrderItemUploadFileIds(item: OrderItem): string[] {
  const ids = new Set<string>();

  for (const id of item.fileIds ?? []) {
    if (id) ids.add(id);
  }

  const meta = item.metadata;
  if (!meta) return [...ids];

  for (const [key, value] of Object.entries(meta)) {
    if (typeof value !== 'string' || !value) continue;
    if (key.endsWith('UploadedFileId') || key === 'uploadedFileId') {
      ids.add(value);
      continue;
    }
    if (key.endsWith('UploadedPhotos')) {
      for (const photo of parsePlacedPhotos(value)) {
        if (photo.fileId) ids.add(photo.fileId);
      }
    }
  }

  return [...ids];
}

export function getOrderItemPreviewImages(
  item: OrderItem,
): { src: string; label: string }[] {
  const images: { src: string; label: string }[] = [];
  const seen = new Set<string>();

  const productId = item.metadata?.productId;
  const product =
    typeof productId === 'string' ? getProductById(productId) : undefined;
  if (product && isUploadOnlyProduct(product)) {
    const color =
      typeof item.metadata?.color === 'string'
        ? item.metadata.color
        : (product.colors?.[0] ?? '#ffffff');
    const mockup =
      product.type === 'magnet'
        ? getMagnetDisplayMockup(product, color)
        : getProductMockup(product, color, 'front');
    if (mockup && !seen.has(mockup)) {
      images.push({ src: mockup, label: 'Product' });
      seen.add(mockup);
    }
  }

  for (const side of PRODUCT_SIDES) {
    const key = SIDE_PREVIEW_CART_KEYS[side];
    const src = item[key];
    if (typeof src === 'string' && src.length > 0 && !seen.has(src)) {
      images.push({ src, label: SIDE_LABELS[side] });
      seen.add(src);
    }
  }

  if (item.metadata) {
    for (const side of PRODUCT_SIDES) {
      const prefix = getSideMetadataPrefix(side);
      const premade = item.metadata[`${prefix}PremadeDesignImage`];
      if (
        typeof premade === 'string' &&
        premade.length > 0 &&
        !seen.has(premade)
      ) {
        images.push({ src: premade, label: `${SIDE_LABELS[side]} design` });
        seen.add(premade);
      }

      const uploaded = item.metadata[`${prefix}UploadedPreviewUrl`];
      if (
        typeof uploaded === 'string' &&
        uploaded.length > 0 &&
        !seen.has(uploaded)
      ) {
        images.push({ src: uploaded, label: 'Your photo' });
        seen.add(uploaded);
      }
    }
  }

  return images;
}

export function sanitizeOrderItemFilename(name: string, fallback: string): string {
  return name.replace(/[^\w\s-]/g, '').trim().slice(0, 40) || fallback;
}
