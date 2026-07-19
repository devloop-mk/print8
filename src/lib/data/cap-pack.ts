import type { ProductDesignTemplate } from '@/lib/data/catalog';

const CAP_BASE = {
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['cap'] as const,
  overlayScale: 32,
  overlayPosition: { x: 50, y: 40 },
  recommendedColor: '#ffffff',
  defaultSide: 'front' as const,
  collection: 'caps-local',
};

const CAPS: Array<{
  id: string;
  file: string;
  titleMk: string;
  titleEn: string;
  recommendedColor?: string;
}> = [
  {
    id: 'makedonija',
    file: 'cap-makedonija.png',
    titleMk: 'Македонија',
    titleEn: 'Macedonia',
  },
  {
    id: 'stip',
    file: 'cap-stip.png',
    titleMk: 'Штип',
    titleEn: 'Štip',
  },
  {
    id: 'mkd',
    file: 'cap-mkd.png',
    titleMk: 'МКД',
    titleEn: 'MKD',
  },
  {
    id: '100-balkan',
    file: 'cap-100-balkan.png',
    titleMk: '100% Балкан',
    titleEn: '100% Balkan',
  },
  {
    id: 'skopje',
    file: 'cap-skopje.png',
    titleMk: 'Скопје',
    titleEn: 'Skopje',
  },
  {
    id: 'ohrid',
    file: 'cap-ohrid.png',
    titleMk: 'Охрид',
    titleEn: 'Ohrid',
  },
  {
    id: 'istok-stip',
    file: 'cap-istok-stip.png',
    titleMk: 'Исток — Штип',
    titleEn: 'East — Štip',
  },
];

export const capPackTemplates: ProductDesignTemplate[] = CAPS.map((item) => ({
  id: `cap-local-${item.id}`,
  nameKey: `capLocal${item.id.replace(/(^|-)([a-z])/g, (_, _h, c: string) => c.toUpperCase())}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/caps/${item.file}`,
  ...CAP_BASE,
  recommendedColor: item.recommendedColor ?? CAP_BASE.recommendedColor,
  productTypes: [...CAP_BASE.productTypes],
}));
