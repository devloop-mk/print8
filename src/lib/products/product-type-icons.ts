import {
  Award,
  Baby,
  CircleUserRound,
  Coffee,
  CupSoda,
  Gem,
  Gift,
  GlassWater,
  LayoutGrid,
  Magnet,
  Puzzle,
  Shirt,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { type ProductType } from '@/lib/data/catalog';
import { isProductTypeHiddenFromStorefront } from '@/lib/products/storefront-hidden-types';
import { getStorefrontProductTypes } from '@/lib/products/drinkware-type-groups';

export type ProductTypeFilterValue = ProductType | 'all';

export const productTypeIconMap: Record<ProductTypeFilterValue, LucideIcon> = {
  all: LayoutGrid,
  't-shirt': Shirt,
  hoodie: Shirt,
  bodysuit: Baby,
  cap: CircleUserRound,
  mug: Coffee,
  cup: CupSoda,
  bag: ShoppingBag,
  thermos: GlassWater,
  magnet: Magnet,
  'photo-stone': Gem,
  puzzle: Puzzle,
  plaque: Award,
  'gift-box': Gift,
  'gift-set': Gift,
};

export function getProductTypeIcon(type: ProductTypeFilterValue): LucideIcon {
  return productTypeIconMap[type] ?? LayoutGrid;
}

export function buildProductTypeFilterOptions(
  label: (type: ProductTypeFilterValue) => string,
) {
  return {
    allOption: {
      value: 'all' as const,
      label: label('all'),
      icon: getProductTypeIcon('all'),
    },
    options: getStorefrontProductTypes()
      .filter((type) => !isProductTypeHiddenFromStorefront(type))
      .map((type) => ({
      value: type,
      label: label(type),
      icon: getProductTypeIcon(type),
    })),
  };
}
