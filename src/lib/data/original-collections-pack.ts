import type { ProductDesignTemplate } from '@/lib/data/catalog';

const OVERLAY_BASE = {
  overlayScale: 40,
  overlayPosition: { x: 50, y: 54 },
  overlayByProductType: {
    hoodie: { scale: 33, position: { x: 50, y: 59 } },
  },
  recommendedColor: '#1C1A1D',
  applicableFits: ['unisex', 'women'] as const,
  defaultSide: 'front' as const,
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt', 'hoodie'] as const,
};

const neonRetroItems = [
    { id: 'grid-sunset', file: 'grid-sunset.png', titleEn: 'Neon Grid Sunset', titleMk: 'Неон мрежа зајдисонце' },
    { id: 'cassette', file: 'cassette.png', titleEn: 'Retro Cassette', titleMk: 'Ретро касета' },
    { id: 'arcade-heart', file: 'arcade-heart.png', titleEn: 'Arcade Pixel Heart', titleMk: 'Аркаден пиксел срце' },
    { id: 'palm-drive', file: 'palm-drive.png', titleEn: 'Palm Drive Night', titleMk: 'Ноќно палми' },
    { id: 'synth-mountain', file: 'synth-mountain.png', titleEn: 'Synthwave Mountain', titleMk: 'Синтвејв планина' },
    { id: 'neon-diner', file: 'neon-diner.png', titleEn: 'Neon Diner Sign', titleMk: 'Неон ресторан' },
];

export const neonRetroPackTemplates: ProductDesignTemplate[] = neonRetroItems.map((item) => ({
  id: `tee-neon-${item.id}`,
  nameKey: `tee-neon-${item.id}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/neon-retro/${item.file}`,
  printMasterImage: `masters/neon-retro/${item.file}`,
  collection: 'neon-retro',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));


const vintageDapperItems = [
    { id: 'flat-cap-art', file: 'flat-cap-art.png', titleEn: 'Flat Cap Pattern', titleMk: 'Муста со капа' },
    { id: 'pocket-watch', file: 'pocket-watch.png', titleEn: 'Pocket Watch', titleMk: 'Джепен часовник' },
    { id: 'razor-kit', file: 'razor-kit.png', titleEn: 'Barber Razor Kit', titleMk: 'Берберски сет' },
    { id: 'factory-skyline', file: 'factory-skyline.png', titleEn: 'Factory Skyline', titleMk: 'Фабрички хоризонт' },
    { id: 'suit-silhouette', file: 'suit-silhouette.png', titleEn: 'Classic Suit', titleMk: 'Класичен костум' },
    { id: 'vintage-moto', file: 'vintage-moto.png', titleEn: 'Vintage Motorcycle', titleMk: 'Винтиџ мотор' },
];

export const vintageDapperPackTemplates: ProductDesignTemplate[] = vintageDapperItems.map((item) => ({
  id: `tee-dapper-${item.id}`,
  nameKey: `tee-dapper-${item.id}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/vintage-dapper/${item.file}`,
  printMasterImage: `masters/vintage-dapper/${item.file}`,
  collection: 'vintage-dapper',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));


const scienceCoreItems = [
    { id: 'periodic-creative', file: 'periodic-creative.png', titleEn: 'Creative Periodic Table', titleMk: 'Периоден систем' },
    { id: 'caffeine-molecule', file: 'caffeine-molecule.png', titleEn: 'Caffeine Molecule', titleMk: 'Кофеин молекул' },
    { id: 'beaker-bubbles', file: 'beaker-bubbles.png', titleEn: 'Beaker Bubbles', titleMk: 'Шише со меурчиња' },
    { id: 'dna-helix', file: 'dna-helix.png', titleEn: 'DNA Helix Art', titleMk: 'ДНК хеликса' },
    { id: 'vintage-microscope', file: 'vintage-microscope.png', titleEn: 'Vintage Microscope', titleMk: 'Винтиџ микроскоп' },
    { id: 'atomic-orbit', file: 'atomic-orbit.png', titleEn: 'Atomic Orbits', titleMk: 'Атомски орбити' },
];

export const scienceCorePackTemplates: ProductDesignTemplate[] = scienceCoreItems.map((item) => ({
  id: `tee-science-${item.id}`,
  nameKey: `tee-science-${item.id}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/science-core/${item.file}`,
  printMasterImage: `masters/science-core/${item.file}`,
  collection: 'science-core',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));


const wildOutdoorsItems = [
    { id: 'mountain-peak', file: 'mountain-peak.png', titleEn: 'Mountain Peak', titleMk: 'Планински врв' },
    { id: 'camp-stars', file: 'camp-stars.png', titleEn: 'Camp Under Stars', titleMk: 'Камп под ѕвезди' },
    { id: 'compass-rose', file: 'compass-rose.png', titleEn: 'Compass Rose', titleMk: 'Компас роза' },
    { id: 'hiking-trail', file: 'hiking-trail.png', titleEn: 'Hiking Trail', titleMk: 'Планинарска патека' },
    { id: 'lake-sunrise', file: 'lake-sunrise.png', titleEn: 'Lake Sunrise', titleMk: 'Изгрејсонце на езеро' },
    { id: 'pine-forest', file: 'pine-forest.png', titleEn: 'Pine Forest', titleMk: 'Борова шума' },
];

export const wildOutdoorsPackTemplates: ProductDesignTemplate[] = wildOutdoorsItems.map((item) => ({
  id: `tee-outdoor-${item.id}`,
  nameKey: `tee-outdoor-${item.id}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/wild-outdoors/${item.file}`,
  printMasterImage: `masters/wild-outdoors/${item.file}`,
  collection: 'wild-outdoors',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));


const dailyGrindItems = [
    { id: 'coffee-first', file: 'coffee-first.png', titleEn: 'Coffee First', titleMk: 'Прво кафе' },
    { id: 'stay-focused', file: 'stay-focused.png', titleEn: 'Stay Focused', titleMk: 'Остани фокусиран' },
    { id: 'hustle-bolt', file: 'hustle-bolt.png', titleEn: 'Hustle Bolt', titleMk: 'Енергија молња' },
    { id: 'books-coffee', file: 'books-coffee.png', titleEn: 'Books & Coffee', titleMk: 'Книги и кафе' },
    { id: 'desk-setup', file: 'desk-setup.png', titleEn: 'Desk Setup', titleMk: 'Работна маса' },
    { id: 'weekend-mode', file: 'weekend-mode.png', titleEn: 'Weekend Mode', titleMk: 'Викенд мод' },
];

export const dailyGrindPackTemplates: ProductDesignTemplate[] = dailyGrindItems.map((item) => ({
  id: `tee-grind-${item.id}`,
  nameKey: `tee-grind-${item.id}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/daily-grind/${item.file}`,
  printMasterImage: `masters/daily-grind/${item.file}`,
  collection: 'daily-grind',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));

export const originalCollectionsPackTemplates: ProductDesignTemplate[] = [
  ...neonRetroPackTemplates,
  ...vintageDapperPackTemplates,
  ...scienceCorePackTemplates,
  ...wildOutdoorsPackTemplates,
  ...dailyGrindPackTemplates,
];
