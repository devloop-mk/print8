import type { ProductDesignTemplate } from '@/lib/data/catalog';

const OVERLAY = {
  overlayScale: 40,
  overlayPosition: { x: 50, y: 54 },
  overlayByProductType: {
    hoodie: { scale: 33, position: { x: 50, y: 59 } },
  },
  recommendedColor: '#ffffff',
  applicableFits: ['unisex', 'women'] as const,
  defaultSide: 'front' as const,
  collection: 'trending-mk',
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt', 'hoodie'] as const,
};

const ITEMS: Array<{ id: string; file: string; titleMk: string; titleEn: string }> = [
  { id: 'skopje-1963', file: 'skopje-1963.png', titleMk: 'Скопје 1963', titleEn: 'Skopje 1963' },
  { id: 'rabotam-od-kafe', file: 'rabotam-od-kafe.png', titleMk: 'Работам од кафе', titleEn: 'Running on coffee' },
  { id: 'ne-mi-se-zboruva', file: 'ne-mi-se-zboruva.png', titleMk: 'Не ми се зборува', titleEn: 'Not in the mood to talk' },
  { id: 'makedonija', file: 'makedonija.png', titleMk: 'Македонија', titleEn: 'Macedonia' },
  { id: 'ponedelnik', file: 'ponedelnik.png', titleMk: 'Понеделник не постои', titleEn: 'Monday does not exist' },
  { id: 'od-makedonija', file: 'od-makedonija.png', titleMk: 'Од Македонија со љубов', titleEn: 'From Macedonia with love' },
  { id: '100-balkan', file: '100-balkan.png', titleMk: '100% Балкан', titleEn: '100% Balkan' },
  { id: 'kje-bide-dobro', file: 'kje-bide-dobro.png', titleMk: 'Ќе биде добро', titleEn: 'It will be okay' },
  { id: 'ne-pitaj', file: 'ne-pitaj.png', titleMk: 'Не прашај', titleEn: "Don't ask" },
  { id: 'machka', file: 'machka.png', titleMk: 'Мачка > луѓе', titleEn: 'Cat > people' },
  { id: 'energija-kafe', file: 'energija-kafe.png', titleMk: 'Енергија кафе', titleEn: 'Coffee energy' },
  { id: 'tatko-mode', file: 'tatko-mode.png', titleMk: 'Татко mode ON', titleEn: 'Dad mode ON' },
  { id: 'majka-profesija', file: 'majka-profesija.png', titleMk: 'Мајка е професија', titleEn: 'Mom is a profession' },
  { id: 'nokna-smena', file: 'nokna-smena.png', titleMk: 'Ноќна смена на мозокот', titleEn: 'Brain night shift' },
  { id: 'ohrid', file: 'ohrid.png', titleMk: 'Охрид', titleEn: 'Ohrid' },
  { id: 'glavata-me-boli', file: 'glavata-me-boli.png', titleMk: 'Главата ме боли од идеи', titleEn: 'Headache from ideas' },
  { id: 'od-mkd', file: 'od-mkd.png', titleMk: 'Јас сум од МКД', titleEn: 'I am from MKD' },
  { id: 'posle-kafeto', file: 'posle-kafeto.png', titleMk: 'После кафето се гледаме', titleEn: 'See you after coffee' },
  { id: 'doma', file: 'doma.png', titleMk: 'Дома', titleEn: 'Home' },
  { id: 'zhivot', file: 'zhivot.png', titleMk: 'Живот подобар од филм', titleEn: 'Life better than a movie' },
];

export const trendingMkPackTemplates: ProductDesignTemplate[] = ITEMS.map((item) => ({
  id: `tee-trend-${item.id}`,
  nameKey: `teeTrend${item.id.replace(/(^|-)([a-z])/g, (_, _h, c: string) => c.toUpperCase())}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/trending-mk/${item.file}`,
  ...OVERLAY,
  productTypes: [...OVERLAY.productTypes],
  applicableFits: [...OVERLAY.applicableFits],
}));
