import type { ProductNavCategoryId } from '@/lib/products/product-nav';

export type CategoryPathId = 'custom' | 'photo' | 'template';

export type CategoryPathImage = {
  src: string;
  objectFit: 'cover' | 'contain';
  objectPosition?: string;
  imageBg?: string;
  accent: string;
  badgeClass: string;
  ringClass: string;
};

const categoryPathImages: Record<
  ProductNavCategoryId,
  Partial<Record<CategoryPathId, CategoryPathImage>>
> = {
  apparel: {
    custom: {
      src: '/t-shirts/tshirt-white.jpg',
      objectFit: 'cover',
      objectPosition: 'center 30%',
      accent: 'from-brand-800/85',
      badgeClass: 'bg-brand-700/90',
      ringClass: 'border-brand-200 ring-brand-100',
    },
    photo: {
      src: '/NEW_DESIGNS/t-shirts/gym-alfa-mentalitet.png',
      objectFit: 'contain',
      imageBg: 'bg-gradient-to-b from-ink-900 to-ink-700',
      accent: 'from-violet-800/85',
      badgeClass: 'bg-violet-700/90',
      ringClass: 'border-violet-200 ring-violet-100',
    },
    template: {
      src: '/NEW_DESIGNS/t-shirts/baby-loading-girl.png',
      objectFit: 'contain',
      imageBg: 'bg-gradient-to-b from-ink-100 to-white',
      accent: 'from-emerald-800/85',
      badgeClass: 'bg-emerald-700/90',
      ringClass: 'border-emerald-200 ring-emerald-100',
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
      src: '/bags/bag-beige.jpg',
      objectFit: 'cover',
      objectPosition: 'center',
      accent: 'from-brand-800/85',
      badgeClass: 'bg-brand-700/90',
      ringClass: 'border-brand-200 ring-brand-100',
    },
    photo: {
      src: '/bags/bag-beige.jpg',
      objectFit: 'cover',
      objectPosition: 'center',
      accent: 'from-violet-800/85',
      badgeClass: 'bg-violet-700/90',
      ringClass: 'border-violet-200 ring-violet-100',
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
