import type { ProductDesignTemplate } from '@/lib/data/catalog';

const BASE = {
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt', 'hoodie'] as const,
  productIds: ['tshirt-kids'] as const,
  overlayScale: 40,
  overlayPosition: { x: 50, y: 54 },
  overlayByProductType: {
    hoodie: { scale: 33, position: { x: 50, y: 59 } },
  },
  recommendedColor: '#ffffff',
  applicableFits: ['kids'] as const,
  defaultSide: 'front' as const,
  collection: 'kids-birthday',
};

type KidsGeneratedItem = {
  id: string;
  file: string;
  titleMk: string;
  titleEn: string;
};

const ITEMS: KidsGeneratedItem[] = [
  {
    id: 'dino-party',
    file: 'kids-tee-01-dino-party.png',
    titleMk: 'Дино забава',
    titleEn: 'Dino party',
  },
  {
    id: 'panda-cake',
    file: 'kids-tee-02-panda-cake.png',
    titleMk: 'Панда со торта',
    titleEn: 'Panda cake',
  },
  {
    id: 'lion-gift',
    file: 'kids-tee-03-lion-gift.png',
    titleMk: 'Лавче со подарок',
    titleEn: 'Lion gift',
  },
  {
    id: 'bear-cake',
    file: 'kids-tee-04-bear-cake.png',
    titleMk: 'Мече со торта',
    titleEn: 'Bear cake',
  },
  {
    id: 'fox-balloon',
    file: 'kids-tee-05-fox-balloon.png',
    titleMk: 'Лисица со балон',
    titleEn: 'Fox balloon',
  },
  {
    id: 'unicorn-party',
    file: 'kids-tee-06-unicorn-party.png',
    titleMk: 'Еднорог забава',
    titleEn: 'Unicorn party',
  },
  {
    id: 'bunny-party',
    file: 'kids-tee-07-bunny-party.png',
    titleMk: 'Зајче забава',
    titleEn: 'Bunny party',
  },
  {
    id: 'kitten-gift',
    file: 'kids-tee-08-kitten-gift.png',
    titleMk: 'Маче со подарок',
    titleEn: 'Kitten gift',
  },
  {
    id: 'puppy-balloon',
    file: 'kids-tee-09-puppy-balloon.png',
    titleMk: 'Кученце со балон',
    titleEn: 'Puppy balloon',
  },
  {
    id: 'owl-party',
    file: 'kids-tee-10-owl-party.png',
    titleMk: 'Бувче забава',
    titleEn: 'Owl party',
  },
  {
    id: 'giraffe-party',
    file: 'kids-tee-11-giraffe-party.png',
    titleMk: 'Жирафче забава',
    titleEn: 'Giraffe party',
  },
  {
    id: 'elephant-party',
    file: 'kids-tee-12-elephant-party.png',
    titleMk: 'Слонче забава',
    titleEn: 'Elephant party',
  },
];

function toNameKey(id: string): string {
  return `teeKidsGen${id.replace(/(^|-)([a-z])/g, (_, _h, c: string) =>
    c.toUpperCase(),
  )}`;
}

export const kidsGeneratedPackTemplates: ProductDesignTemplate[] = ITEMS.map(
  (item) => ({
    id: `tee-kids-gen-${item.id}`,
    nameKey: toNameKey(item.id),
    titleEn: item.titleEn,
    titleMk: item.titleMk,
    overlayImage: `/NEW_DESIGNS/kids-generated/${item.file}`,
    ...BASE,
    productTypes: [...BASE.productTypes],
    productIds: [...BASE.productIds],
    applicableFits: [...BASE.applicableFits],
  }),
);

export const KIDS_GENERATED_DESIGN_IDS = kidsGeneratedPackTemplates.map(
  (design) => design.id,
);
