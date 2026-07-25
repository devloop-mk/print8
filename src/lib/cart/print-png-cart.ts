import type { CartItem } from '@/lib/cart/types';
import { isDataUrl } from '@/lib/storage/cart-storage';
import {
  PRODUCT_SIDES,
  SIDE_PRINT_PNG_CART_KEYS,
} from '@/lib/products/product-sides';
import { orderItemSideUsesPremadeMasterForProduction } from '@/lib/products/premade-artwork-source';

export function cartHasInlinePrintPngs(items: CartItem[]): boolean {
  return items.some((item) =>
    PRODUCT_SIDES.some((side) => {
      if (orderItemSideUsesPremadeMasterForProduction(item.metadata, side)) {
        return false;
      }
      const value = item[SIDE_PRINT_PNG_CART_KEYS[side]];
      return typeof value === 'string' && isDataUrl(value);
    }),
  );
}
