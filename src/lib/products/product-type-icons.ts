import {
  CircleUserRound,
  Coffee,
  CupSoda,
  FlaskConical,
  Gift,
  LayoutGrid,
  Shirt,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react';
import { productTypes, type ProductType } from '@/lib/data/catalog';

export type ProductTypeFilterValue = ProductType | 'all';

export const productTypeIconMap: Record<ProductTypeFilterValue, LucideIcon> = {
  all: LayoutGrid,
  't-shirt': Shirt,
  hoodie: Shirt,
  cap: CircleUserRound,
  mug: Coffee,
  cup: CupSoda,
  bag: ShoppingBag,
  thermos: FlaskConical,
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
    options: productTypes.map((type) => ({
      value: type,
      label: label(type),
      icon: getProductTypeIcon(type),
    })),
  };
}
