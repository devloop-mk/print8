import type { DesignCategory } from '@/lib/data/catalog';
import { designCategoryPrices } from '@/lib/data/design-order-fields';

export const CUSTOM_DESIGN_CATEGORIES = [
  'business-cards',
  'wedding',
  'birthday',
  'menus',
  'logo-branding',
  'social-media',
  'other',
] as const;

export type CustomDesignCategoryId = (typeof CUSTOM_DESIGN_CATEGORIES)[number];

export const CUSTOM_DESIGN_PRODUCT_TARGETS = [
  'print-only',
  't-shirt',
  'hoodie',
  'cup',
  'bag',
  'cap',
  'magnet',
  'other-product',
] as const;

export type CustomDesignProductTarget =
  (typeof CUSTOM_DESIGN_PRODUCT_TARGETS)[number];

export const CUSTOM_DESIGN_ORDER_TYPE = 'custom-design-request' as const;

export function mapCustomDesignCategory(
  categoryId: CustomDesignCategoryId,
): DesignCategory {
  switch (categoryId) {
    case 'business-cards':
    case 'wedding':
    case 'birthday':
    case 'menus':
      return categoryId;
    case 'logo-branding':
    case 'social-media':
    case 'other':
    default:
      return 'general';
  }
}

export function getCustomDesignUnitPrice(
  categoryId: CustomDesignCategoryId,
): number {
  return designCategoryPrices[mapCustomDesignCategory(categoryId)];
}
