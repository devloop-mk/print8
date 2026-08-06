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

/** Representative gallery thumbs for /designs category cards. */
export const designCategoryCoverImages: Record<DesignCategory, string> = {
  'business-cards': '/NEW_DESIGNS/gallery-thumbs/svg-bcard-luxury-gold.webp',
  wedding: '/NEW_DESIGNS/gallery-thumbs/svg-wedding-romantic-blush.webp',
  birthday: '/NEW_DESIGNS/gallery-thumbs/svg-bday-unicorn.webp',
  menus: '/NEW_DESIGNS/gallery-thumbs/svg-menu-finedining.webp',
  general: '/NEW_DESIGNS/gallery-thumbs/svg-bcard-tech-wave.webp',
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

export function designCategoryHref(
  categoryId: DesignCategory,
  options?: { tag?: string; q?: string; page?: number },
): string {
  const params = new URLSearchParams();
  if (options?.tag) params.set('tag', options.tag);
  const trimmed = options?.q?.trim();
  if (trimmed) params.set('q', trimmed);
  if (options?.page && options.page > 1) {
    params.set('page', String(options.page));
  }
  const queryString = params.toString();
  const base = `/designs/${categoryId}`;
  return queryString ? `${base}?${queryString}` : base;
}

export function designsAllHref(options?: {
  q?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  const trimmed = options?.q?.trim();
  if (trimmed) params.set('q', trimmed);
  if (options?.page && options.page > 1) {
    params.set('page', String(options.page));
  }
  const queryString = params.toString();
  return queryString ? `/designs/all?${queryString}` : '/designs/all';
}

/** Gallery path for a category filter (or the full catalog). */
export function designsGalleryHref(
  category: DesignCategory | 'all',
  options?: { tag?: string; q?: string; page?: number },
): string {
  if (category === 'all') {
    return designsAllHref({ q: options?.q, page: options?.page });
  }
  return designCategoryHref(category, options);
}

export function isDesignsNavActive(pathname: string): boolean {
  return pathname === '/designs' || pathname.startsWith('/designs/');
}
