import type { ProductDesignTemplate } from '@/lib/data/catalog';

const DIR = '/NEW_DESIGNS/dual-side-generated';

export const dualSideGeneratedPackTemplates: ProductDesignTemplate[] = [
  {
    id: 'tee-dual-rogue-eyes',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'dualRogueEyes',
    titleMk: 'Отпадник — очи',
    titleEn: 'Rogue — Eyes',
    defaultSide: 'front',
    designSides: ['front', 'back'],
    collection: 'streetwear',
    recommendedColor: '#000000',
    applicableColors: ['#000000', '#1C1A1D', '#ffffff', '#c5ccd6'],
    overlayImage: `${DIR}/dual-front-rogue-marks.png`,
    overlayScale: 22,
    overlayPosition: { x: 36, y: 40 },
    overlayByProductType: {
      hoodie: { scale: 18, position: { x: 36, y: 44 } },
    },
    backOverlay: {
      overlayImage: `${DIR}/dual-back-eye-panels.png`,
      overlayScale: 58,
      overlayPosition: { x: 50, y: 48 },
      overlayByProductType: {
        hoodie: { scale: 50, position: { x: 50, y: 52 } },
      },
    },
  },
  {
    id: 'tee-dual-storm-hero',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'dualStormHero',
    titleMk: 'Бура — херои',
    titleEn: 'Storm — Hero',
    defaultSide: 'front',
    designSides: ['front', 'back'],
    collection: 'streetwear',
    recommendedColor: '#ffffff',
    applicableColors: ['#ffffff', '#000000', '#c5ccd6'],
    overlayImage: `${DIR}/dual-front-storm-mark.png`,
    overlayScale: 20,
    overlayPosition: { x: 35, y: 38 },
    overlayByProductType: {
      hoodie: { scale: 16, position: { x: 35, y: 42 } },
    },
    backOverlay: {
      overlayImage: `${DIR}/dual-back-storm-hero.png`,
      overlayScale: 56,
      overlayPosition: { x: 50, y: 47 },
      overlayByProductType: {
        hoodie: { scale: 48, position: { x: 50, y: 52 } },
      },
    },
  },
  {
    id: 'tee-dual-blade-warrior',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: 'dualBladeWarrior',
    titleMk: 'Сечило — воин',
    titleEn: 'Blade — Warrior',
    defaultSide: 'front',
    designSides: ['front', 'back'],
    collection: 'streetwear',
    recommendedColor: '#ffffff',
    applicableColors: ['#ffffff', '#000000', '#c5ccd6'],
    overlayImage: `${DIR}/dual-front-blade-mark.png`,
    overlayScale: 18,
    overlayPosition: { x: 34, y: 38 },
    overlayByProductType: {
      hoodie: { scale: 15, position: { x: 34, y: 42 } },
    },
    backOverlay: {
      overlayImage: `${DIR}/dual-back-blade-warrior.png`,
      overlayScale: 55,
      overlayPosition: { x: 50, y: 48 },
      overlayByProductType: {
        hoodie: { scale: 47, position: { x: 50, y: 52 } },
      },
    },
  },
];
