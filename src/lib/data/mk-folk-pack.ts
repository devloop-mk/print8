import type { ProductDesignTemplate } from '@/lib/data/catalog';

/** Spot artwork — centered print for apparel. */
const SPOT_BASE = {
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt'] as const,
  overlayScale: 42,
  overlayPosition: { x: 50, y: 48 },
  overlayByProductType: {
    't-shirt': { scale: 40, position: { x: 50, y: 52 } },
  },
  recommendedColor: '#ffffff',
  applicableFits: ['unisex', 'women'] as const,
  defaultSide: 'front' as const,
  collection: 'mk-folk',
};

/** Full mug circumference wraps — panoramic print covering the mug body. */
const WRAP_BASE = {
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['mug', 'cup'] as const,
  overlayScale: 96,
  overlayPosition: { x: 50, y: 48 },
  recommendedColor: '#ffffff',
  defaultSide: 'front' as const,
  collection: 'mk-folk',
};

const SPOT_ITEMS: Array<{
  id: string;
  file: string;
  titleMk: string;
  titleEn: string;
}> = [
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

const WRAP_ITEMS: Array<{
  id: string;
  file: string;
  titleMk: string;
  titleEn: string;
}> = [
  {
    id: 'wrap-nasheto-oro',
    file: 'wrap-nasheto-oro.png',
    titleMk: 'Нашето оро',
    titleEn: 'Our oro',
  },
  {
    id: 'wrap-ezerska-bajka',
    file: 'wrap-ezerska-bajka.png',
    titleMk: 'Езерска бајка',
    titleEn: 'Lake fairy tale',
  },
  {
    id: 'wrap-tradicija-oro',
    file: 'wrap-tradicija-oro.png',
    titleMk: 'Традиција — Македонско оро',
    titleEn: 'Tradition — Macedonian oro',
  },
  {
    id: 'wrap-vkus-makedonija',
    file: 'wrap-vkus-makedonija.png',
    titleMk: 'Вкус на Македонија',
    titleEn: 'Taste of Macedonia',
  },
  {
    id: 'wrap-ohrid-srce',
    file: 'wrap-ohrid-srce.png',
    titleMk: 'Охрид — Македонија во срце',
    titleEn: 'Ohrid — Macedonia in the heart',
  },
  {
    id: 'wrap-makedonski-vez',
    file: 'wrap-makedonski-vez.png',
    titleMk: 'Македонски вез',
    titleEn: 'Macedonian embroidery',
  },
];

function toNameKey(id: string) {
  return `mkFolk${id.replace(/(^|-)([a-z])/g, (_, _h, c: string) =>
    c.toUpperCase(),
  )}`;
}

const spotTemplates: ProductDesignTemplate[] = SPOT_ITEMS.map((item) => ({
  id: `mk-folk-${item.id}`,
  nameKey: toNameKey(item.id),
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/mk-folk/${item.file}`,
  ...SPOT_BASE,
  productTypes: [...SPOT_BASE.productTypes],
  applicableFits: [...SPOT_BASE.applicableFits],
}));

const wrapTemplates: ProductDesignTemplate[] = WRAP_ITEMS.map((item) => ({
  id: `mk-folk-${item.id}`,
  nameKey: toNameKey(item.id),
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/mk-folk/${item.file}`,
  ...WRAP_BASE,
  productTypes: [...WRAP_BASE.productTypes],
}));

export const mkFolkPackTemplates: ProductDesignTemplate[] = [
  ...wrapTemplates,
  ...spotTemplates,
];
