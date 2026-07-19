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

export const productNavCategoryIds: ProductNavCategoryId[] = [
  'apparel',
  'drinkware',
  'bags',
  'gifts',
];

export type ProductNavCategory = {
  id: ProductNavCategoryId;
  icon: LucideIcon;
  types: ProductType[];
  /** Paths shown on the category landing chooser (defaults to all applicable). */
  chooserPaths?: Array<'custom' | 'photo' | 'template'>;
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
    types: ['t-shirt', 'hoodie', 'bodysuit', 'cap'],
    chooserPaths: ['custom', 'photo'],
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
    href: PRODUCT_OFFERING_PATHS.all,
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

export function isProductNavCategoryId(
  value: string,
): value is ProductNavCategoryId {
  return (productNavCategoryIds as readonly string[]).includes(value);
}

export function getProductNavCategory(
  categoryId: ProductNavCategoryId,
): ProductNavCategory {
  const category = productNavCategories.find((item) => item.id === categoryId);
  if (!category) {
    throw new Error(`Unknown product category: ${categoryId}`);
  }
  return category;
}

export function getCategoryForProductType(
  type: ProductType,
): ProductNavCategory | undefined {
  return productNavCategories.find((category) => category.types.includes(type));
}

export function productCategoryHref(categoryId: ProductNavCategoryId): string {
  return `/products/category/${categoryId}`;
}

export function productCategoryCustomHref(categoryId: ProductNavCategoryId): string {
  return `/products/custom?category=${categoryId}`;
}

export function productCategoryBrowseHref(categoryId: ProductNavCategoryId): string {
  return productCategoryCustomHref(categoryId);
}

export function productCategoryReadyDesignsHref(categoryId: ProductNavCategoryId): string {
  return `/products/ready-designs?category=${categoryId}`;
}

export function productCategoryTextTemplatesHref(categoryId: ProductNavCategoryId): string {
  return `/products/text-templates?category=${categoryId}`;
}

export function productBelongsToCategory(
  product: { type: ProductType },
  categoryId: ProductNavCategoryId,
): boolean {
  return getProductNavCategory(categoryId).types.includes(product.type);
}

export function parseProductNavCategoryFilter(
  value: string | null,
): ProductNavCategoryId | 'all' {
  if (value && isProductNavCategoryId(value)) return value;
  return 'all';
}

export function productTypeHref(type: ProductType): string {
  return `/products/type/${encodeURIComponent(type)}`;
}

export function isProductsNavActive(pathname: string): boolean {
  return pathname === '/products' || pathname.startsWith('/products/');
}
