import type { ProductDesignTemplate } from '@/lib/data/catalog';

const PATCH_MUG_PRODUCT_IDS = ['mug-red-patch', 'mug-window-blue'] as const;

/** Centered spot art sized for the white sublimation patch on patch/window mugs. */
const PATCH_MUG_BASE = {
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['mug'] as const,
  productIds: [...PATCH_MUG_PRODUCT_IDS],
  overlayScale: 38,
  overlayPosition: { x: 50, y: 50 },
  overlayByProductId: {
    'mug-red-patch': { scale: 38, position: { x: 50, y: 50 } },
    'mug-window-blue': { scale: 38, position: { x: 50, y: 50 } },
  },
  applicableColors: ['#dc2626', '#2563eb'],
  defaultSide: 'front' as const,
  collection: 'patch-mug',
};

const PATCH_DESIGNS: Array<{
  id: string;
  file: string;
  titleMk: string;
  titleEn: string;
}> = [
  {
    id: 'vkus-makedonija',
    file: 'vkus-makedonija.png',
    titleMk: 'Вкус на Македонија',
    titleEn: 'Taste of Macedonia',
  },
  {
    id: 'ezerska-bajka',
    file: 'ezerska-bajka.png',
    titleMk: 'Езерска бајка',
    titleEn: 'Lake fairy tale',
  },
  {
    id: 'tradicija-oro',
    file: 'tradicija-oro.png',
    titleMk: 'Традиција - Македонско оро',
    titleEn: 'Tradition - Macedonian oro',
  },
  {
    id: 'ohrid-srce',
    file: 'ohrid-srce.png',
    titleMk: 'Охрид - Македонија во срце',
    titleEn: 'Ohrid - Macedonia in the heart',
  },
  {
    id: 'nasheto-oro',
    file: 'nasheto-oro.png',
    titleMk: 'Нашето оро',
    titleEn: 'Our oro',
  },
  {
    id: 'makedonija-srce',
    file: 'mug-makedonija-srce.png',
    titleMk: 'Македонија од срце',
    titleEn: 'Macedonia from the heart',
  },
  {
    id: 'skopje',
    file: 'mug-skopje.png',
    titleMk: 'Скопје',
    titleEn: 'Skopje',
  },
  {
    id: 'stip-stamp',
    file: 'mug-stip-stamp.png',
    titleMk: 'Штип печат',
    titleEn: 'Stip stamp',
  },
];

function toNameKey(id: string) {
  return `patchMug${id.replace(/(^|-)([a-z])/g, (_, _h, c: string) =>
    c.toUpperCase(),
  )}`;
}

export const patchMugPackTemplates: ProductDesignTemplate[] = PATCH_DESIGNS.map(
  (item) => ({
    id: `mug-patch-${item.id}`,
    nameKey: toNameKey(item.id),
    titleEn: item.titleEn,
    titleMk: item.titleMk,
    overlayImage: item.file.startsWith('mug-')
      ? `/NEW_DESIGNS/local-mk-drinkware/${item.file}`
      : `/NEW_DESIGNS/mk-folk/${item.file}`,
    ...PATCH_MUG_BASE,
    productTypes: [...PATCH_MUG_BASE.productTypes],
    productIds: [...PATCH_MUG_BASE.productIds],
    applicableColors: [...PATCH_MUG_BASE.applicableColors],
  }),
);
