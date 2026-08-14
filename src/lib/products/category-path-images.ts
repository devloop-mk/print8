import type { ProductNavCategoryId } from '@/lib/products/product-nav';
import type { OverlayPlacement } from '@/lib/products/design-overlay';

export type CategoryPathId = 'custom' | 'photo' | 'template';

export type CategoryPathDesignOverlay = OverlayPlacement & {
  src: string;
};

export type CategoryPathImage = {
  src: string;
  objectFit: 'cover' | 'contain';
  objectPosition?: string;
  imageBg?: string;
  accent: string;
  badgeClass: string;
  ringClass: string;
  /** Optional artwork layered on the blank product (ready-designs card). */
  designOverlay?: CategoryPathDesignOverlay;
};

const categoryPathImages: Record<
  ProductNavCategoryId,
  Partial<Record<CategoryPathId, CategoryPathImage>>
> = {
  apparel: {
    custom: {
      src: '/hero/hero-your-brand-v5.png',
      objectFit: 'cover',
      objectPosition: 'center',
      imageBg: 'bg-ink-900',
      accent: 'from-brand-900/90',
      badgeClass: 'bg-brand-600',
      ringClass: 'border-brand-200 ring-brand-100',
    },
    photo: {
      src: '/hero/hero-photo-designs-v4.png',
      objectFit: 'cover',
      objectPosition: 'center 40%',
      imageBg: 'bg-ink-900',
      accent: 'from-violet-900/90',
      badgeClass: 'bg-violet-600',
      ringClass: 'border-violet-200 ring-violet-100',
    },
  },
  drinkware: {
    custom: {
      src: '/mugs/mug-white.jpg',
      objectFit: 'cover',
      objectPosition: 'center',
      accent: 'from-brand-800/85',
      badgeClass: 'bg-brand-700/90',
      ringClass: 'border-brand-200 ring-brand-100',
    },
    photo: {
      src: '/mugs/design-coffee-bear.jpg',
      objectFit: 'cover',
      objectPosition: 'center',
      accent: 'from-violet-800/85',
      badgeClass: 'bg-violet-700/90',
      ringClass: 'border-violet-200 ring-violet-100',
    },
    template: {
      src: '/mugs/mug-inside-love.jpg',
      objectFit: 'cover',
      objectPosition: 'center',
      accent: 'from-emerald-800/85',
      badgeClass: 'bg-emerald-700/90',
      ringClass: 'border-emerald-200 ring-emerald-100',
    },
  },
  bags: {
    custom: {
      src: '/bags/bag-naturella-natural.jpg',
      objectFit: 'cover',
      objectPosition: 'center',
      accent: 'from-brand-800/85',
      badgeClass: 'bg-brand-700/90',
      ringClass: 'border-brand-200 ring-brand-100',
    },
    photo: {
      // Blank tote + design overlay (same pattern as HomeCategoryGrid bags tile).
      src: '/bags/bag-naturella-natural.jpg',
      objectFit: 'contain',
      objectPosition: 'center',
      imageBg: 'bg-ink-50',
      accent: 'from-violet-800/85',
      badgeClass: 'bg-violet-700/90',
      ringClass: 'border-violet-200 ring-violet-100',
      designOverlay: {
        src: '/NEW_DESIGNS/bags/tote-skopje-line.png',
        position: { x: 50, y: 54 },
        scale: 26,
      },
    },
  },
  gifts: {
    custom: {
      src: '/magnets/magnet-ceramic-heart.jpg',
      objectFit: 'cover',
      objectPosition: 'center',
      accent: 'from-brand-800/85',
      badgeClass: 'bg-brand-700/90',
      ringClass: 'border-brand-200 ring-brand-100',
    },
    photo: {
      src: '/magnets/magnet-glass-5x7.jpg',
      objectFit: 'cover',
      objectPosition: 'center',
      accent: 'from-violet-800/85',
      badgeClass: 'bg-violet-700/90',
      ringClass: 'border-violet-200 ring-violet-100',
    },
  },
};

const defaultPathImages: Record<CategoryPathId, CategoryPathImage> = {
  custom: {
    src: '/showcase/showcase-printing.svg',
    objectFit: 'contain',
    imageBg: 'bg-gradient-to-b from-brand-50 to-white',
    accent: 'from-brand-800/85',
    badgeClass: 'bg-brand-700/90',
    ringClass: 'border-brand-200 ring-brand-100',
  },
  photo: {
    src: '/showcase/showcase-photo-designs.svg',
    objectFit: 'contain',
    imageBg: 'bg-gradient-to-b from-violet-50 to-white',
    accent: 'from-violet-800/85',
    badgeClass: 'bg-violet-700/90',
    ringClass: 'border-violet-200 ring-violet-100',
  },
  template: {
    src: '/showcase/showcase-text-templates.svg',
    objectFit: 'contain',
    imageBg: 'bg-gradient-to-b from-emerald-50 to-white',
    accent: 'from-emerald-800/85',
    badgeClass: 'bg-emerald-700/90',
    ringClass: 'border-emerald-200 ring-emerald-100',
  },
};

export function getCategoryPathImage(
  categoryId: ProductNavCategoryId,
  pathId: CategoryPathId,
): CategoryPathImage {
  return (
    categoryPathImages[categoryId][pathId] ??
    defaultPathImages[pathId]
  );
}
