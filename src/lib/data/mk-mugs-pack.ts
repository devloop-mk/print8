import type { ProductDesignTemplate } from '@/lib/data/catalog';

const SPOT_BASE = {
  overlayScale: 44,
  overlayPosition: { x: 50, y: 46 },
  recommendedColor: '#ffffff',
  defaultSide: 'front' as const,
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['mug'] as const,
  productIds: ['mug-classic'],
};

const WRAP_BASE = {
  overlayScale: 96,
  overlayPosition: { x: 50, y: 48 },
  recommendedColor: '#ffffff',
  defaultSide: 'front' as const,
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['mug'] as const,
  productIds: ['mug-classic'],
};

type MugItem = {
  id: string;
  file: string;
  titleEn: string;
  titleMk: string;
  layout: 'wrap' | 'spot';
};

const mkMugsItems: MugItem[] = [
  {
    id: 'wrap-kafe-duh',
    file: 'wrap-kafe-duh.png',
    titleEn: 'Coffee Is My Spirit',
    titleMk: 'Кафе е мој дух',
    layout: 'wrap',
  },
  {
    id: 'wrap-dobro-utro',
    file: 'wrap-dobro-utro.png',
    titleEn: 'Good Morning, Macedonia',
    titleMk: 'Добро утро, Македонија',
    layout: 'wrap',
  },
  {
    id: 'wrap-od-makedonija',
    file: 'wrap-od-makedonija.png',
    titleEn: 'From Macedonia with Love',
    titleMk: 'Од Македонија со љубов',
    layout: 'wrap',
  },
  {
    id: 'wrap-gradovi-mk',
    file: 'wrap-gradovi-mk.png',
    titleEn: 'MK Cities Wrap',
    titleMk: 'МК градови — wrap',
    layout: 'wrap',
  },
  {
    id: 'wrap-nastavnica',
    file: 'wrap-nastavnica.png',
    titleEn: 'Best Teacher',
    titleMk: 'Најдобра наставничка',
    layout: 'wrap',
  },
  {
    id: 'wrap-print8-brand',
    file: 'wrap-print8-brand.png',
    titleEn: 'Print8 Brand Wrap',
    titleMk: 'Print8 — печати со стил',
    layout: 'wrap',
  },
  {
    id: 'spot-najdobra-baba',
    file: 'spot-najdobra-baba.png',
    titleEn: 'Best Grandma',
    titleMk: 'Најдобра баба',
    layout: 'spot',
  },
  {
    id: 'spot-najposebna-majka',
    file: 'spot-najposebna-majka.png',
    titleEn: 'Most Special Mom',
    titleMk: 'Најпосебна мајка',
    layout: 'spot',
  },
  {
    id: 'spot-najdobar-tatko',
    file: 'spot-najdobar-tatko.png',
    titleEn: 'Best Dad',
    titleMk: 'Најдобар татко',
    layout: 'spot',
  },
  {
    id: 'spot-kade-kafe',
    file: 'spot-kade-kafe.png',
    titleEn: 'Where Is My Coffee?',
    titleMk: 'Каде е моето кафе?',
    layout: 'spot',
  },
  {
    id: 'spot-rodenden-kralica',
    file: 'spot-rodenden-kralica.png',
    titleEn: 'Birthday Queen',
    titleMk: 'Роденденска кралица',
    layout: 'spot',
  },
  {
    id: 'spot-najdobri-prijateli',
    file: 'spot-najdobri-prijateli.png',
    titleEn: 'Best Friends Forever',
    titleMk: 'Најдобри пријатели засекогаш',
    layout: 'spot',
  },
];

export const mkMugsPackTemplates: ProductDesignTemplate[] = mkMugsItems.map(
  (item) => {
    const base = item.layout === 'wrap' ? WRAP_BASE : SPOT_BASE;
    return {
      id: `mug-mk-${item.id}`,
      nameKey: `mug-mk-${item.id}`,
      titleEn: item.titleEn,
      titleMk: item.titleMk,
      overlayImage: `/NEW_DESIGNS/mk-mugs/${item.file}`,
      printMasterImage: `masters/mk-mugs/${item.file}`,
      collection: 'mk-mugs',
      ...base,
      productTypes: [...base.productTypes],
      productIds: [...base.productIds],
    };
  },
);
