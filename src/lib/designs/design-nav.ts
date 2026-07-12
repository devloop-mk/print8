import {
  Cake,
  CreditCard,
  Heart,
  LayoutGrid,
  Palette,
  Sparkles,
  UtensilsCrossed,
  Wand2,
  type LucideIcon,
} from 'lucide-react';
import {
  designCategories,
  type DesignCategory,
} from '@/lib/data/catalog';

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

export const designNavCategories: DesignNavCategory[] = [
  { id: 'business-cards', icon: CreditCard },
  { id: 'wedding', icon: Heart },
  { id: 'birthday', icon: Cake },
  { id: 'menus', icon: UtensilsCrossed },
];

export const designNavQuickLinks: DesignNavQuickLink[] = [
  {
    id: 'all',
    href: '/designs',
    icon: LayoutGrid,
    labelKey: 'allDesigns',
    descriptionKey: 'allDesignsDesc',
  },
  {
    id: 'studio',
    href: '/designs/create',
    icon: Palette,
    labelKey: 'designStudio',
    descriptionKey: 'designStudioDesc',
  },
  {
    id: 'custom',
    href: '/designs/custom',
    icon: Wand2,
    labelKey: 'customDesignOrder',
    descriptionKey: 'customDesignOrderDesc',
  },
  {
    id: 'customizable',
    href: '/designs',
    icon: Sparkles,
    labelKey: 'customizable',
    descriptionKey: 'customizableDesc',
  },
];

export function isDesignCategory(value: string): value is DesignCategory {
  return (designCategories as readonly string[]).includes(value);
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
  return `/designs?category=${categoryId}`;
}

export function isDesignsNavActive(pathname: string): boolean {
  return pathname === '/designs' || pathname.startsWith('/designs/');
}
