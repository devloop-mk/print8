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

export type SidePrintPngCartKey =
  | 'frontPrintPng'
  | 'backPrintPng'
  | 'leftPrintPng'
  | 'rightPrintPng';

export const SIDE_PREVIEW_CART_KEYS: Record<ProductSide, SidePreviewCartKey> = {
  front: 'designPreview',
  back: 'backDesignPreview',
  left: 'leftDesignPreview',
  right: 'rightDesignPreview',
};

export const SIDE_PRINT_PNG_CART_KEYS: Record<ProductSide, SidePrintPngCartKey> =
  {
    front: 'frontPrintPng',
    back: 'backPrintPng',
    left: 'leftPrintPng',
    right: 'rightPrintPng',
  };

export function getSidePreviewFromCartItem(
  item: {
    designPreview?: string;
    backDesignPreview?: string;
    leftDesignPreview?: string;
    rightDesignPreview?: string;
    metadata?: Record<string, string | number | boolean>;
  },
  side: ProductSide,
): string | undefined {
  const fromItem = item[SIDE_PREVIEW_CART_KEYS[side]];
  if (fromItem) return fromItem;

  const prefix = getSideMetadataPrefix(side);
  const premade = item.metadata?.[`${prefix}PremadeDesignImage`];
  if (typeof premade === 'string' && premade.length > 0) {
    return premade;
  }

  return undefined;
}
