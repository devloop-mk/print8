import type { CartItem } from '@/lib/cart/types';
import { getProductById } from '@/lib/cart/product-cart';
import {
  calculateBrandingPackTotal,
  getBrandingPackLineItems,
  isBrandingPackCartItem,
  parseBrandingPackState,
  serializeBrandingPackState,
  type BrandingPackState,
} from '@/lib/products/branding-pack-state';
import { nanoid } from 'nanoid';

export function createBrandingPackId(): string {
  return nanoid(10);
}

export function buildBrandingPackEditUrl(cartItemId: string): string {
  return `/products/branding-pack?edit=${cartItemId}`;
}

export function getBrandingPackStateFromCartItem(
  item: CartItem,
): BrandingPackState | null {
  if (!isBrandingPackCartItem(item)) return null;
  const raw = item.metadata?.brandingPackData;
  if (typeof raw !== 'string') return null;
  return parseBrandingPackState(raw);
}

export function buildBrandingPackCartPayload({
  state,
  packLabel,
}: {
  state: BrandingPackState;
  packLabel: string;
}): Omit<CartItem, 'id'> {
  const total = calculateBrandingPackTotal(state);
  const lineCount = getBrandingPackLineItems(state).length;
  const primaryPreview =
    state.previewImages?.[0]?.dataUrl ?? state.logo?.previewUrl;

  return {
    type: 'product',
    name: packLabel,
    price: total,
    quantity: 1,
    metadata: {
      isBrandingPack: true,
      isCustomized: true,
      brandingPackId: state.packId,
      brandingPackData: serializeBrandingPackState(state),
      brandingPackLineCount: lineCount,
    },
    designPreview: primaryPreview,
    fileIds: state.logo?.fileId ? [state.logo.fileId] : undefined,
  };
}

export function getBrandingPackCartPreviewImages(item: CartItem): Array<{
  src: string;
  label?: string;
}> {
  const state = getBrandingPackStateFromCartItem(item);
  if (!state?.previewImages?.length) {
    if (item.designPreview) {
      return [{ src: item.designPreview, label: item.name }];
    }
    return [];
  }

  return state.previewImages.map((img) => ({
    src: img.dataUrl,
    label: `${img.productType} · ${img.side}`,
  }));
}

export { isBrandingPackCartItem };
