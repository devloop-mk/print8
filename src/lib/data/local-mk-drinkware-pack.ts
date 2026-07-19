import type { ProductDesignTemplate } from '@/lib/data/catalog';

const MUG_BASE = {
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['mug', 'cup'] as const,
  overlayScale: 42,
  overlayPosition: { x: 50, y: 45 },
  recommendedColor: '#ffffff',
  defaultSide: 'front' as const,
  collection: 'local-mk',
};

const MUGS: Array<{ id: string; file: string; titleMk: string; titleEn: string }> = [
  {
    id: 'stip-isar',
    file: 'mug-stip-isar.png',
    titleMk: 'Штип — Исар',
    titleEn: 'Štip — Isar fortress',
  },
  {
    id: 'stip-stamp',
    file: 'mug-stip-stamp.png',
    titleMk: 'Штип печат',
    titleEn: 'Štip stamp',
  },
  {
    id: 'stip-pastrmajlija',
    file: 'mug-stip-pastrmajlija.png',
    titleMk: 'Штипска пастрмајлија',
    titleEn: 'Štip pastrmajlija',
  },
  {
    id: 'stip-karakter',
    file: 'mug-stip-karakter.png',
    titleMk: 'Штип — од исток со карактер',
    titleEn: 'Štip — east with character',
  },
  {
    id: 'od-stip-ljubov',
    file: 'mug-od-stip-ljubov.png',
    titleMk: 'Од Штип со љубов',
    titleEn: 'From Štip with love',
  },
  {
    id: 'kafe-od-stip',
    file: 'mug-kafe-od-stip.png',
    titleMk: 'Кафе од Штип',
    titleEn: 'Coffee from Štip',
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
    id: 'ohrid',
    file: 'mug-ohrid.png',
    titleMk: 'Охрид',
    titleEn: 'Ohrid',
  },
];

export const localMkDrinkwarePackTemplates: ProductDesignTemplate[] = MUGS.map((item) => ({
  id: `mug-local-${item.id}`,
  nameKey: `mugLocal${item.id.replace(/(^|-)([a-z])/g, (_, _h, c: string) => c.toUpperCase())}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/drinkware/${item.file}`,
  ...MUG_BASE,
  productTypes: [...MUG_BASE.productTypes],
}));
