import type { ProductDesignTemplate } from '@/lib/data/catalog';

const BAG_BASE = {
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['bag'] as const,
  overlayScale: 34,
  overlayPosition: { x: 50, y: 52 },
  recommendedColor: '#D8C3A5',
  defaultSide: 'front' as const,
  collection: 'bags-local',
};

const BAGS: Array<{
  id: string;
  file: string;
  titleMk: string;
  titleEn: string;
}> = [
  {
    id: 'skopje-line',
    file: 'tote-skopje-line.png',
    titleMk: 'Скопје — линија',
    titleEn: 'Skopje — line',
  },
  {
    id: 'best-friends',
    file: 'tote-best-friends.png',
    titleMk: 'Најдобри пријатели',
    titleEn: 'Best friends',
  },
  {
    id: 'market-day',
    file: 'tote-market-day.png',
    titleMk: 'Пазар ден',
    titleEn: 'Market day',
  },
  {
    id: 'ohrid-lake',
    file: 'tote-ohrid-lake.png',
    titleMk: 'Охрид — езеро',
    titleEn: 'Ohrid — lake',
  },
];

export const bagPackTemplates: ProductDesignTemplate[] = BAGS.map((item) => ({
  id: `bag-local-${item.id}`,
  nameKey: `bagLocal${item.id.replace(/(^|-)([a-z])/g, (_, _h, c: string) => c.toUpperCase())}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/bags/${item.file}`,
  ...BAG_BASE,
  productTypes: [...BAG_BASE.productTypes],
}));
