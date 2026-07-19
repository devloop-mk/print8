import {
  Cake,
  CreditCard,
  Heart,
  LayoutGrid,
  UtensilsCrossed,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import type { DesignCategory } from '@/lib/data/catalog';

/** Keep in sync with `designCategories` in catalog — listed here to avoid
 *  pulling the full catalog (streetwear packs, etc.) into the Header graph. */
const DESIGN_NAV_CATEGORY_IDS = [
  'business-cards',
  'wedding',
  'birthday',
  'menus',
  'general',
] as const satisfies readonly DesignCategory[];

export type DesignNavCategory = {
  id: DesignCategory;
  icon: LucideIcon;
};

export type DesignNavQuickLink = {
  id: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  descriptionKey: string;
};

export const designCategoryIcons: Record<DesignCategory, LucideIcon> = {
  'business-cards': CreditCard,
  wedding: Heart,
  birthday: Cake,
  menus: UtensilsCrossed,
  general: LayoutGrid,
};

export const designNavCategories: DesignNavCategory[] =
  DESIGN_NAV_CATEGORY_IDS.map((id) => ({
    id,
    icon: designCategoryIcons[id],
  }));

export const designNavQuickLinks: DesignNavQuickLink[] = [
  {
    id: 'all',
    href: '/designs/all',
    icon: LayoutGrid,
    labelKey: 'allDesigns',
    descriptionKey: 'allDesignsDesc',
  },
  {
    id: 'custom',
    href: '/designs/custom',
    icon: Wand2,
    labelKey: 'customDesignOrder',
    descriptionKey: 'customDesignOrderDesc',
  },
];

export function isDesignCategory(value: string): value is DesignCategory {
  return (DESIGN_NAV_CATEGORY_IDS as readonly string[]).includes(value);
}

export function getDesignNavCategory(
  categoryId: DesignCategory,
): DesignNavCategory {
  const category = designNavCategories.find((item) => item.id === categoryId);
  if (!category) {
    throw new Error(`Unknown design category: ${categoryId}`);
  }
  return category;
}

export function designCategoryHref(categoryId: DesignCategory): string {
  return `/designs/all?category=${categoryId}`;
}

export function designsAllHref(): string {
  return '/designs/all';
}

export function isDesignsNavActive(pathname: string): boolean {
  return pathname === '/designs' || pathname.startsWith('/designs/');
}
