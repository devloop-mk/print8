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
  recommendedColor: '#ffffff',
  defaultSide: 'front' as const,
  collection: 'kids-birthday',
};

type KidsItem = {
  id: string;
  file: string;
  titleMk: string;
  titleEn: string;
  /** Parent matching tees are adult-fit; kids designs lock to kids. */
  audience: 'kids' | 'adult' | 'both';
};

const ITEMS: KidsItem[] = [
  {
    id: 'rodendensko-dete',
    file: 'rodendensko-dete.png',
    titleMk: 'Роденденско дете',
    titleEn: 'Birthday kid',
    audience: 'kids',
  },
  {
    id: 'rodendensko-momche',
    file: 'rodendensko-momche.png',
    titleMk: 'Роденденско момче',
    titleEn: 'Birthday boy',
    audience: 'kids',
  },
  {
    id: 'rodendensko-devojche',
    file: 'rodendensko-devojche.png',
    titleMk: 'Роденденско девојче',
    titleEn: 'Birthday girl',
    audience: 'kids',
  },
  {
    id: 'mama-na-rodendenskoto',
    file: 'mama-na-rodendenskoto.png',
    titleMk: 'Мама на роденденското дете',
    titleEn: 'Mom of the birthday kid',
    audience: 'adult',
  },
  {
    id: 'tato-na-rodendenskoto',
    file: 'tato-na-rodendenskoto.png',
    titleMk: 'Тато на роденденското дете',
    titleEn: 'Dad of the birthday kid',
    audience: 'adult',
  },
  {
    id: 'dino-rodenden',
    file: 'dino-rodenden.png',
    titleMk: 'Дино роденден',
    titleEn: 'Dino birthday',
    audience: 'kids',
  },
  {
    id: 'svemirski-rodenden',
    file: 'svemirski-rodenden.png',
    titleMk: 'Свемирски роденден',
    titleEn: 'Space birthday',
    audience: 'kids',
  },
  {
    id: 'ednorog-rodenden',
    file: 'ednorog-rodenden.png',
    titleMk: 'Еднорог роденден',
    titleEn: 'Unicorn birthday',
    audience: 'kids',
  },
  {
    id: 'super-heroj',
    file: 'super-heroj.png',
    titleMk: 'Супер херој',
    titleEn: 'Super hero',
    audience: 'kids',
  },
  {
    id: 'golem-brat',
    file: 'golem-brat.png',
    titleMk: 'Голем брат',
    titleEn: 'Big brother',
    audience: 'kids',
  },
  {
    id: 'golema-sestra',
    file: 'golema-sestra.png',
    titleMk: 'Голема сестра',
    titleEn: 'Big sister',
    audience: 'kids',
  },
  {
    id: 'malo-chudo',
    file: 'malo-chudo.png',
    titleMk: 'Мало чудо',
    titleEn: 'Little miracle',
    audience: 'kids',
  },
  {
    id: 'igrach',
    file: 'igrach.png',
    titleMk: 'Играч',
    titleEn: 'Player',
    audience: 'kids',
  },
  {
    id: 'shumsko-dete',
    file: 'shumsko-dete.png',
    titleMk: 'Шумско дете',
    titleEn: 'Forest kid',
    audience: 'kids',
  },
  {
    id: 'denes-e-moj-den',
    file: 'denes-e-moj-den.png',
    titleMk: 'Денес е мој ден',
    titleEn: 'Today is my day',
    audience: 'both',
  },
];

function fitsFor(audience: KidsItem['audience']): Array<'unisex' | 'women' | 'kids'> {
  if (audience === 'kids') return ['kids'];
  if (audience === 'adult') return ['unisex', 'women'];
  return ['unisex', 'women', 'kids'];
}

export const kidsBirthdayPackTemplates: ProductDesignTemplate[] = ITEMS.map((item) => {
  const applicableFits = fitsFor(item.audience);
  return {
    id: `tee-kids-${item.id}`,
    nameKey: `teeKids${item.id.replace(/(^|-)([a-z])/g, (_, _h, c: string) => c.toUpperCase())}`,
    titleEn: item.titleEn,
    titleMk: item.titleMk,
    overlayImage: `/NEW_DESIGNS/kids-birthday/${item.file}`,
    applicableFits,
    ...(item.audience === 'kids' ? { productIds: ['tshirt-kids'] } : {}),
    ...BASE,
    productTypes: [...BASE.productTypes],
  };
});
