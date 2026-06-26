import {
  Coffee,
  Gift,
  LayoutGrid,
  Palette,
  Shirt,
  ShoppingBag,
  Sparkles,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { ProductType } from '@/lib/data/catalog';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';

export type ProductNavCategoryId =
  | 'apparel'
  | 'drinkware'
  | 'bags'
  | 'gifts';

export type ProductNavCategory = {
  id: ProductNavCategoryId;
  icon: LucideIcon;
  types: ProductType[];
};

export type ProductNavQuickLink = {
  id: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  descriptionKey: string;
};

export const productNavCategories: ProductNavCategory[] = [
  {
    id: 'apparel',
    icon: Shirt,
    types: ['t-shirt', 'hoodie', 'cap'],
  },
  {
    id: 'drinkware',
    icon: Coffee,
    types: ['mug', 'cup', 'thermos'],
  },
  {
    id: 'bags',
    icon: ShoppingBag,
    types: ['bag'],
  },
  {
    id: 'gifts',
    icon: Gift,
    types: ['magnet', 'gift-set'],
  },
];

export const productNavQuickLinks: ProductNavQuickLink[] = [
  {
    id: 'all',
    href: '/products',
    icon: LayoutGrid,
    labelKey: 'allProducts',
    descriptionKey: 'allProductsDesc',
  },
  {
    id: 'custom',
    href: PRODUCT_OFFERING_PATHS.custom,
    icon: Palette,
    labelKey: 'customDesign',
    descriptionKey: 'customDesignDesc',
  },
  {
    id: 'readyDesigns',
    href: PRODUCT_OFFERING_PATHS.readyDesigns,
    icon: Sparkles,
    labelKey: 'readyDesigns',
    descriptionKey: 'readyDesignsDesc',
  },
  {
    id: 'textTemplates',
    href: PRODUCT_OFFERING_PATHS.textTemplates,
    icon: Type,
    labelKey: 'textTemplates',
    descriptionKey: 'textTemplatesDesc',
  },
];

export function productTypeHref(type: ProductType): string {
  return `/products?type=${encodeURIComponent(type)}`;
}

export function isProductsNavActive(pathname: string): boolean {
  return pathname === '/products' || pathname.startsWith('/products/');
}
