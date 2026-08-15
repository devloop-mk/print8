'use client';

import type { CartItem } from '@/lib/cart/types';
import {
  isMenuPrintCartItem,
  parseMenuPrintOptions,
} from '@/lib/designs/menu-print-options';
import { MenuPrintOptionsSummary } from '@/components/designs/MenuPrintOptionsSummary';

export function MenuPrintCartDetails({ item }: { item: CartItem }) {
  if (!isMenuPrintCartItem(item)) return null;

  const options = parseMenuPrintOptions(item.metadata);
  const designFee =
    typeof item.metadata?.menuDesignFee === 'number'
      ? item.metadata.menuDesignFee
      : 0;

  return <MenuPrintOptionsSummary options={options} designFee={designFee} />;
}
