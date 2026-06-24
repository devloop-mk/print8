import type { ProductSide } from '@/lib/data/catalog';
import {
  createDefaultSideDesign,
  type SideDesign,
} from '@/lib/products/design-state';

export const PRODUCT_SIDES: ProductSide[] = [
  'front',
  'back',
  'left',
  'right',
];

export function isProductSide(value: string): value is ProductSide {
  return (PRODUCT_SIDES as string[]).includes(value);
}

/** Metadata / cart field prefix for a product side (frontCustomText, leftCustomText, …). */
export function getSideMetadataPrefix(side: ProductSide): string {
  return side;
}

export function createSideDesignsForSides(
  sides: ProductSide[],
): Record<ProductSide, SideDesign> {
  return sides.reduce(
    (acc, side) => {
      acc[side] = createDefaultSideDesign();
      return acc;
    },
    {} as Record<ProductSide, SideDesign>,
  );
}

export type SidePreviewCartKey =
  | 'designPreview'
  | 'backDesignPreview'
  | 'leftDesignPreview'
  | 'rightDesignPreview';

export const SIDE_PREVIEW_CART_KEYS: Record<ProductSide, SidePreviewCartKey> = {
  front: 'designPreview',
  back: 'backDesignPreview',
  left: 'leftDesignPreview',
  right: 'rightDesignPreview',
};

export function getSidePreviewFromCartItem(
  item: {
    designPreview?: string;
    backDesignPreview?: string;
    leftDesignPreview?: string;
    rightDesignPreview?: string;
  },
  side: ProductSide,
): string | undefined {
  return item[SIDE_PREVIEW_CART_KEYS[side]];
}
