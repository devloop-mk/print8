import type { ProductDesignTemplate } from '@/lib/data/catalog';

const BASE = {
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt', 'mug', 'cup'] as const,
  overlayScale: 42,
  overlayPosition: { x: 50, y: 48 },
  overlayByProductType: {
    't-shirt': { scale: 40, position: { x: 50, y: 52 } },
    mug: { scale: 44, position: { x: 50, y: 46 } },
    cup: { scale: 44, position: { x: 50, y: 46 } },
  },
  recommendedColor: '#ffffff',
  applicableFits: ['unisex', 'women'] as const,
  defaultSide: 'front' as const,
  collection: 'mk-folk',
};

const ITEMS: Array<{ id: string; file: string; titleMk: string; titleEn: string }> = [
  {
    id: 'nasheto-oro',
    file: 'nasheto-oro.png',
    titleMk: 'Нашето оро',
    titleEn: 'Our oro',
  },
  {
    id: 'ezerska-bajka',
    file: 'ezerska-bajka.png',
    titleMk: 'Езерска бајка',
    titleEn: 'Lake fairy tale',
  },
  {
    id: 'ohrid-srce',
    file: 'ohrid-srce.png',
    titleMk: 'Охрид — Македонија во срце',
    titleEn: 'Ohrid — Macedonia in the heart',
  },
  {
    id: 'tradicija-oro',
    file: 'tradicija-oro.png',
    titleMk: 'Традиција — Македонско оро',
    titleEn: 'Tradition — Macedonian oro',
  },
  {
    id: 'vkus-makedonija',
    file: 'vkus-makedonija.png',
    titleMk: 'Вкус на Македонија',
    titleEn: 'Taste of Macedonia',
  },
];

export const mkFolkPackTemplates: ProductDesignTemplate[] = ITEMS.map((item) => ({
  id: `mk-folk-${item.id}`,
  nameKey: `mkFolk${item.id.replace(/(^|-)([a-z])/g, (_, _h, c: string) =>
    c.toUpperCase(),
  )}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/mk-folk/${item.file}`,
  ...BASE,
  productTypes: [...BASE.productTypes],
  applicableFits: [...BASE.applicableFits],
}));
