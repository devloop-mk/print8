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
import { products, productTypes } from '@/lib/data/catalog';
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

export function getProductsForCategory(categoryId: ProductNavCategoryId) {
  const category = getProductNavCategory(categoryId);
  return products.filter((product) => category.types.includes(product.type));
}

/** Sample products from other types for cross-sell on type pages. */
export function getSuggestedProductsForType(
  currentType: ProductType,
  limit = 8,
) {
  const parentCategory = getCategoryForProductType(currentType);
  const siblingTypes = (parentCategory?.types ?? []).filter(
    (type) => type !== currentType,
  );
  const otherTypes = productTypes.filter((type) => type !== currentType);
  const orderedTypes = [
    ...siblingTypes,
    ...otherTypes.filter((type) => !siblingTypes.includes(type)),
  ];

  const result: typeof products = [];
  for (const type of orderedTypes) {
    const matches = products.filter((product) => product.type === type);
    for (const product of matches.slice(0, 2)) {
      if (result.length >= limit) return result;
      result.push(product);
    }
  }
  return result;
}

export function productCategoryHref(categoryId: ProductNavCategoryId): string {
  return `/products/category/${categoryId}`;
}

export function productCategoryBrowseHref(categoryId: ProductNavCategoryId): string {
  return `/products/category/${categoryId}/browse`;
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
