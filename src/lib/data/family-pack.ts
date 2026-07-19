import type { ProductDesignTemplate } from '@/lib/data/catalog';

const BASE = {
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt', 'hoodie'] as const,
  overlayScale: 40,
  overlayPosition: { x: 50, y: 54 },
  overlayByProductType: {
    hoodie: { scale: 33, position: { x: 50, y: 59 } },
  },
  defaultSide: 'front' as const,
  collection: 'family',
};

type FamilyItem = {
  id: string;
  file: string;
  titleMk: string;
  titleEn: string;
  recommendedColor: string;
  applicableFits: Array<'unisex' | 'women' | 'kids'>;
  productIds?: string[];
};

const ITEMS: FamilyItem[] = [
  {
    id: 'newspaper-dad',
    file: 'newspaper-dad.png',
    titleMk: 'The Dad Times',
    titleEn: 'The Dad Times',
    recommendedColor: '#ffffff',
    applicableFits: ['unisex'],
  },
  {
    id: 'newspaper-mom',
    file: 'newspaper-mom.png',
    titleMk: 'The Mom Times',
    titleEn: 'The Mom Times',
    recommendedColor: '#ffffff',
    applicableFits: ['unisex', 'women'],
  },
  {
    id: 'newspaper-kid',
    file: 'newspaper-kid.png',
    titleMk: 'The Kid Times',
    titleEn: 'The Kid Times',
    recommendedColor: '#ffffff',
    applicableFits: ['kids'],
    productIds: ['tshirt-kids'],
  },
  {
    id: 'newspaper-brother',
    file: 'newspaper-brother.png',
    titleMk: 'The Brother Times',
    titleEn: 'The Brother Times',
    recommendedColor: '#ffffff',
    applicableFits: ['kids', 'unisex'],
  },
  {
    id: 'newspaper-sister',
    file: 'newspaper-sister.png',
    titleMk: 'The Sister Times',
    titleEn: 'The Sister Times',
    recommendedColor: '#ffffff',
    applicableFits: ['kids', 'unisex', 'women'],
  },
  {
    id: 'newspaper-grandpa',
    file: 'newspaper-grandpa.png',
    titleMk: 'The Grandpa Times',
    titleEn: 'The Grandpa Times',
    recommendedColor: '#ffffff',
    applicableFits: ['unisex'],
  },
  {
    id: 'newspaper-grandma',
    file: 'newspaper-grandma.png',
    titleMk: 'The Grandma Times',
    titleEn: 'The Grandma Times',
    recommendedColor: '#ffffff',
    applicableFits: ['unisex', 'women'],
  },
  {
    id: 'stack-tato',
    file: 'stack-tato.png',
    titleMk: 'TATO фото мрежа',
    titleEn: 'TATO photo grid',
    recommendedColor: '#ffffff',
    applicableFits: ['unisex'],
  },
  {
    id: 'stack-mama',
    file: 'stack-mama.png',
    titleMk: 'MAMA фото мрежа',
    titleEn: 'MAMA photo grid',
    recommendedColor: '#000000',
    applicableFits: ['unisex', 'women'],
  },
  {
    id: 'stack-baba',
    file: 'stack-baba.png',
    titleMk: 'BABA фото мрежа',
    titleEn: 'BABA photo grid',
    recommendedColor: '#ffffff',
    applicableFits: ['unisex', 'women'],
  },
  {
    id: 'stack-deda',
    file: 'stack-deda.png',
    titleMk: 'DEDA фото мрежа',
    titleEn: 'DEDA photo grid',
    recommendedColor: '#ffffff',
    applicableFits: ['unisex'],
  },
  {
    id: 'stack-kid',
    file: 'stack-kid.png',
    titleMk: 'KID фото мрежа',
    titleEn: 'KID photo grid',
    recommendedColor: '#ffffff',
    applicableFits: ['kids'],
    productIds: ['tshirt-kids'],
  },
];

export const familyPackTemplates: ProductDesignTemplate[] = ITEMS.map((item) => ({
  id: `tee-family-${item.id}`,
  nameKey: `teeFamily${item.id.replace(/(^|-)([a-z])/g, (_, _h, c: string) => c.toUpperCase())}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/family/${item.file}`,
  recommendedColor: item.recommendedColor,
  applicableFits: item.applicableFits,
  ...(item.productIds ? { productIds: item.productIds } : {}),
  ...BASE,
  productTypes: [...BASE.productTypes],
}));
