import type { ProductDesignTemplate } from '@/lib/data/catalog';

const DIR = '/NEW_DESIGNS/polo';
const POLO_PRODUCT_ID = 'polo-frut-original-white';

const POLO_BACK_OVERLAY = {
  overlayScale: 54,
  overlayPosition: { x: 50, y: 48 },
};

const POLO_BASE = {
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt'] as const,
  productIds: [POLO_PRODUCT_ID],
  recommendedColor: '#ffffff',
  applicableColors: ['#ffffff'],
  applicableFits: ['unisex'] as const,
  defaultSide: 'front' as const,
  designSides: ['front', 'back'] as const,
  collection: 'polo',
  overlayScale: 18,
  overlayPosition: { x: 36, y: 40 },
};

export const poloPackTemplates: ProductDesignTemplate[] = [
  {
    ...POLO_BASE,
    id: 'polo-ai-alpine-expedition',
    nameKey: 'poloAiAlpineExpedition',
    titleMk: 'Alpine Expedition — мало напред, големо назад',
    titleEn: 'Alpine Expedition — small front, large back',
    overlayImage: `${DIR}/polo-ai-alpine-front.png`,
    backOverlay: {
      ...POLO_BACK_OVERLAY,
      overlayImage: `${DIR}/polo-ai-alpine-back.png`,
    },
    productTypes: [...POLO_BASE.productTypes],
    applicableFits: [...POLO_BASE.applicableFits],
    designSides: [...POLO_BASE.designSides],
  },
  {
    ...POLO_BASE,
    id: 'polo-ai-urban-wave',
    nameKey: 'poloAiUrbanWave',
    titleMk: 'Urban Wave — мало напред, големо назад',
    titleEn: 'Urban Wave — small front, large back',
    overlayImage: `${DIR}/polo-ai-urban-wave-front.png`,
    backOverlay: {
      ...POLO_BACK_OVERLAY,
      overlayImage: `${DIR}/polo-ai-urban-wave-back.png`,
    },
    productTypes: [...POLO_BASE.productTypes],
    applicableFits: [...POLO_BASE.applicableFits],
    designSides: [...POLO_BASE.designSides],
  },
  {
    ...POLO_BASE,
    id: 'polo-ai-heritage-club',
    nameKey: 'poloAiHeritageClub',
    titleMk: 'Heritage Club — мало напред, големо назад',
    titleEn: 'Heritage Club crest — small front, large back',
    overlayImage: `${DIR}/polo-ai-heritage-front.png`,
    backOverlay: {
      ...POLO_BACK_OVERLAY,
      overlayImage: `${DIR}/polo-ai-heritage-back.png`,
    },
    productTypes: [...POLO_BASE.productTypes],
    applicableFits: [...POLO_BASE.applicableFits],
    designSides: [...POLO_BASE.designSides],
  },
];
