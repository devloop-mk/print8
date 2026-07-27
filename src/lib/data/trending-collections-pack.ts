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

const stranger80sItems = [
    { id: 'demogorgon', file: 'demogorgon.png', titleEn: 'Demogorgon Beast', titleMk: 'Демогоргон' },
    { id: 'kids-bikes', file: 'kids-bikes.png', titleEn: 'Kids on Bikes', titleMk: 'Деца на бајци' },
    { id: 'upside-portal', file: 'upside-portal.png', titleEn: 'Upside Down Portal', titleMk: 'Портал на другата страна' },
    { id: 'neon-title', file: 'neon-title.png', titleEn: 'Neon Retro Title', titleMk: 'Неон наслов' },
    { id: 'lab-door', file: 'lab-door.png', titleEn: 'Secret Lab Door', titleMk: 'Тајна лабораторија' },
    { id: 'walkie-talkie', file: 'walkie-talkie.png', titleEn: 'Walkie Talkie', titleMk: 'Рација' },
    { id: 'arcade-cabinet', file: 'arcade-cabinet.png', titleEn: 'Retro Arcade', titleMk: 'Ретро аркада' },
    { id: 'mind-flipper', file: 'mind-flipper.png', titleEn: 'Mind Flayer Shadow', titleMk: 'Сенка на Mind Flayer' },
];

export const stranger80sPackTemplates: ProductDesignTemplate[] = stranger80sItems.map((item) => ({
  id: `tee-str80-${item.id}`,
  nameKey: `tee-str80-${item.id}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/stranger-80s/${item.file}`,
  printMasterImage: `masters/stranger-80s/${item.file}`,
  collection: 'stranger-80s',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));


const peakyEraItems = [
    { id: 'flat-cap-boss', file: 'flat-cap-boss.png', titleEn: 'Flat Cap Boss', titleMk: 'Шеф со капа' },
    { id: 'razor-blade', file: 'razor-blade.png', titleEn: 'Razor Blade', titleMk: 'Бритва' },
    { id: 'gang-walk', file: 'gang-walk.png', titleEn: 'Gang Walk', titleMk: 'Одење на бандата' },
    { id: 'order-typo', file: 'order-typo.png', titleEn: 'By Order Of', titleMk: 'По наредба' },
    { id: 'factory-smoke', file: 'factory-smoke.png', titleEn: 'Factory Smoke', titleMk: 'Фабрички дим' },
    { id: 'three-caps', file: 'three-caps.png', titleEn: 'Three Peaked Caps', titleMk: 'Три капи' },
    { id: 'horse-race', file: 'horse-race.png', titleEn: 'Horse Race Night', titleMk: 'Ноќно тркање' },
];

export const peakyEraPackTemplates: ProductDesignTemplate[] = peakyEraItems.map((item) => ({
  id: `tee-peaky-${item.id}`,
  nameKey: `tee-peaky-${item.id}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/peaky-era/${item.file}`,
  printMasterImage: `masters/peaky-era/${item.file}`,
  collection: 'peaky-era',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));


const zombieSurvivalItems = [
    { id: 'zombie-horde', file: 'zombie-horde.png', titleEn: 'Zombie Horde', titleMk: 'Зомби орда' },
    { id: 'crossbow-hunter', file: 'crossbow-hunter.png', titleEn: 'Crossbow Hunter', titleMk: 'Арбалет ловец' },
    { id: 'gas-mask', file: 'gas-mask.png', titleEn: 'Gas Mask Survivor', titleMk: 'Гас маска' },
    { id: 'dead-highway', file: 'dead-highway.png', titleEn: 'Dead Highway', titleMk: 'Мртва автопат' },
    { id: 'barricade', file: 'barricade.png', titleEn: 'Barricade Zone', titleMk: 'Барикада' },
    { id: 'keep-out-door', file: 'keep-out-door.png', titleEn: 'Keep Out Door', titleMk: 'Не отворај' },
    { id: 'survivor-skull', file: 'survivor-skull.png', titleEn: 'Survivor Skull', titleMk: 'Череп преживувач' },
];

export const zombieSurvivalPackTemplates: ProductDesignTemplate[] = zombieSurvivalItems.map((item) => ({
  id: `tee-zombie-${item.id}`,
  nameKey: `tee-zombie-${item.id}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/zombie-survival/${item.file}`,
  printMasterImage: `masters/zombie-survival/${item.file}`,
  collection: 'zombie-survival',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));


const cartelCrimeItems = [
    { id: 'kingpin-portrait', file: 'kingpin-portrait.png', titleEn: 'Kingpin Portrait', titleMk: 'Крал на криминал' },
    { id: 'tropical-mansion', file: 'tropical-mansion.png', titleEn: 'Tropical Mansion', titleMk: 'Тропична палата' },
    { id: 'cash-stacks', file: 'cash-stacks.png', titleEn: 'Cash Stacks', titleMk: 'Парични купчиња' },
    { id: 'vintage-car', file: 'vintage-car.png', titleEn: 'Vintage Crime Car', titleMk: 'Винтиџ автомобил' },
    { id: 'jungle-plane', file: 'jungle-plane.png', titleEn: 'Jungle Plane', titleMk: 'Авион во џунгла' },
    { id: 'roses-pistol', file: 'roses-pistol.png', titleEn: 'Roses & Pistol', titleMk: 'Рози и пиштол' },
    { id: 'gold-luxury', file: 'gold-luxury.png', titleEn: 'Gold Luxury', titleMk: 'Златен луксуз' },
];

export const cartelCrimePackTemplates: ProductDesignTemplate[] = cartelCrimeItems.map((item) => ({
  id: `tee-cartel-${item.id}`,
  nameKey: `tee-cartel-${item.id}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/cartel-crime/${item.file}`,
  printMasterImage: `masters/cartel-crime/${item.file}`,
  collection: 'cartel-crime',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));


const bikerRebelItems = [
    { id: 'skull-bandana', file: 'skull-bandana.png', titleEn: 'Skull Bandana', titleMk: 'Череп со бандана' },
    { id: 'chopper-flames', file: 'chopper-flames.png', titleEn: 'Chopper Flames', titleMk: 'Чопер со пламоци' },
    { id: 'club-patch', file: 'club-patch.png', titleEn: 'Club Patch', titleMk: 'Клубски знак' },
    { id: 'open-highway', file: 'open-highway.png', titleEn: 'Open Highway', titleMk: 'Отворен пат' },
    { id: 'rebel-fist', file: 'rebel-fist.png', titleEn: 'Rebel Fist', titleMk: 'Бунтовнички подигнат прст' },
    { id: 'leather-vest', file: 'leather-vest.png', titleEn: 'Leather Vest', titleMk: 'Кожен дукс' },
    { id: 'night-rider', file: 'night-rider.png', titleEn: 'Night Rider', titleMk: 'Ноќен возач' },
];

export const bikerRebelPackTemplates: ProductDesignTemplate[] = bikerRebelItems.map((item) => ({
  id: `tee-biker-${item.id}`,
  nameKey: `tee-biker-${item.id}`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/biker-rebel/${item.file}`,
  printMasterImage: `masters/biker-rebel/${item.file}`,
  collection: 'biker-rebel',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));

export const trendingCollectionsPackTemplates: ProductDesignTemplate[] = [
  ...stranger80sPackTemplates,
  ...peakyEraPackTemplates,
  ...zombieSurvivalPackTemplates,
  ...cartelCrimePackTemplates,
  ...bikerRebelPackTemplates,
];
