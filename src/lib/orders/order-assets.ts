import type { CartItem } from '@/lib/cart/types';
import type { CheckoutInput } from '@/lib/validations/order';
import type { ProductSide } from '@/lib/data/catalog';
import { PRODUCT_SIDES, getSideMetadataPrefix } from '@/lib/products/product-sides';
import { parsePlacedStickers } from '@/lib/products/sticker-library';

export const MAX_STICKERS_PER_ORDER = 24;
export const MAX_PHOTOS_PER_ORDER = 10;

export type OrderItemLike = {
  metadata?: Record<string, string | number | boolean>;
  fileIds?: string[];
};

export interface OrderStickerRef {
  itemIndex: number;
  itemName: string;
  side: ProductSide;
  stickerId: string;
}

export function collectOrderFileIds(data: {
  items: OrderItemLike[];
  fileIds?: string[];
}): string[] {
  const ids = new Set<string>();
  for (const id of data.fileIds ?? []) ids.add(id);
  for (const item of data.items) {
    for (const id of item.fileIds ?? []) ids.add(id);
    const meta = item.metadata;
    if (!meta) continue;
    for (const [key, value] of Object.entries(meta)) {
      if (
        (key.endsWith('UploadedFileId') || key === 'uploadedFileId') &&
        typeof value === 'string' &&
        value
      ) {
        ids.add(value);
      }
    }
  }
  return [...ids];
}

export function countStickersInItems(items: OrderItemLike[]): number {
  let total = 0;
  for (const item of items) {
    const meta = item.metadata;
    if (!meta) continue;
    for (const [key, value] of Object.entries(meta)) {
      if (key.endsWith('Stickers') && typeof value === 'string') {
        total += parsePlacedStickers(value).length;
      }
    }
  }
  return total;
}

export function countPhotosInItems(
  items: OrderItemLike[],
  extraFileIds: string[] = [],
): number {
  return collectOrderFileIds({ items, fileIds: extraFileIds }).length;
}

export function collectOrderStickers(
  items: CheckoutInput['items'],
): OrderStickerRef[] {
  const refs: OrderStickerRef[] = [];

  items.forEach((item, itemIndex) => {
    const meta = item.metadata;
    if (!meta) return;

    for (const side of PRODUCT_SIDES) {
      const prefix = getSideMetadataPrefix(side);
      const stickers = parsePlacedStickers(meta[`${prefix}Stickers`]);
      for (const sticker of stickers) {
        refs.push({
          itemIndex,
          itemName: item.name,
          side,
          stickerId: sticker.stickerId,
        });
      }
    }
  });

  return refs;
}

export function evaluateCartAssetLimits(
  existingItems: CartItem[],
  incoming: {
    stickerCount: number;
    photoCount: number;
    excludingItemId?: string;
    extraCheckoutFileIds?: string[];
  },
): {
  ok: boolean;
  stickerCount: number;
  photoCount: number;
  stickersOver: number;
  photosOver: number;
} {
  const remainingItems = incoming.excludingItemId
    ? existingItems.filter((item) => item.id !== incoming.excludingItemId)
    : existingItems;

  const stickerCount =
    countStickersInItems(remainingItems) + incoming.stickerCount;
  const photoCount =
    countPhotosInItems(remainingItems, incoming.extraCheckoutFileIds ?? []) +
    incoming.photoCount;

  const stickersOver = Math.max(0, stickerCount - MAX_STICKERS_PER_ORDER);
  const photosOver = Math.max(0, photoCount - MAX_PHOTOS_PER_ORDER);

  return {
    ok: stickersOver === 0 && photosOver === 0,
    stickerCount,
    photoCount,
    stickersOver,
    photosOver,
  };
}

export function validateOrderAssetLimits(
  data: Pick<CheckoutInput, 'items' | 'fileIds'>,
):
  | { ok: true; stickerCount: number; photoCount: number }
  | {
      ok: false;
      stickerCount: number;
      photoCount: number;
      error: 'too_many_stickers' | 'too_many_photos';
    } {
  const stickerCount = countStickersInItems(data.items);
  const photoCount = countPhotosInItems(data.items, data.fileIds ?? []);

  if (stickerCount > MAX_STICKERS_PER_ORDER) {
    return {
      ok: false,
      stickerCount,
      photoCount,
      error: 'too_many_stickers',
    };
  }

  if (photoCount > MAX_PHOTOS_PER_ORDER) {
    return {
      ok: false,
      stickerCount,
      photoCount,
      error: 'too_many_photos',
    };
  }

  return { ok: true, stickerCount, photoCount };
}
