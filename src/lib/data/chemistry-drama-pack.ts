import type { ProductDesignTemplate } from '@/lib/data/catalog';

const OVERLAY = {
  overlayScale: 40,
  overlayPosition: { x: 50, y: 54 },
  overlayByProductType: {
    hoodie: { scale: 33, position: { x: 50, y: 59 } },
  },
  recommendedColor: '#1C1A1D',
  applicableFits: ['unisex', 'women'] as const,
  defaultSide: 'front' as const,
  collection: 'chemistry-drama',
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt', 'hoodie'] as const,
};

const ITEMS: Array<{
  id: string;
  file: string;
  titleMk: string;
  titleEn: string;
}> = [
  {
    id: 'walter-heisenberg',
    file: 'walter-heisenberg.png',
    titleMk: 'Walter White / Heisenberg',
    titleEn: 'Walter White / Heisenberg',
  },
  {
    id: 'jesse-pinkman',
    file: 'jesse-pinkman.png',
    titleMk: 'Jesse Pinkman',
    titleEn: 'Jesse Pinkman',
  },
  {
    id: 'walter-jesse-duo',
    file: 'walter-jesse-duo.png',
    titleMk: 'Walter & Jesse',
    titleEn: 'Walter & Jesse',
  },
  {
    id: 'lab-partners',
    file: 'lab-partners.png',
    titleMk: 'Лабораторија — партнери',
    titleEn: 'Lab Partners',
  },
  {
    id: 'br-ba-elements',
    file: 'br-ba-elements.png',
    titleMk: 'Br + Ba елементи',
    titleEn: 'Br + Ba Elements',
  },
  {
    id: 'blue-crystals',
    file: 'blue-crystals.png',
    titleMk: 'Сини кристали',
    titleEn: 'Blue Crystals',
  },
  {
    id: 'desert-rv',
    file: 'desert-rv.png',
    titleMk: 'RV во пустина',
    titleEn: 'Desert RV',
  },
  {
    id: 'know-my-name',
    file: 'know-my-name.png',
    titleMk: 'Know My Name',
    titleEn: 'Know My Name',
  },
];

export const chemistryDramaPackTemplates: ProductDesignTemplate[] = ITEMS.map(
  (item) => ({
    id: `tee-chem-${item.id}`,
    nameKey: `teeChem${item.id.replace(/(^|-)([a-z])/g, (_, _h, c: string) => c.toUpperCase())}`,
    titleEn: item.titleEn,
    titleMk: item.titleMk,
    overlayImage: `/NEW_DESIGNS/chemistry-drama/${item.file}`,
    printMasterImage: `masters/chemistry-drama/${item.file}`,
    ...OVERLAY,
    productTypes: [...OVERLAY.productTypes],
    applicableFits: [...OVERLAY.applicableFits],
  }),
);
