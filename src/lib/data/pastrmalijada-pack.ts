import type { ProductDesignTemplate } from '@/lib/data/catalog';

const TEE_BASE = {
  overlayScale: 40,
  overlayPosition: { x: 50, y: 54 },
  overlayByProductType: {
    hoodie: { scale: 33, position: { x: 50, y: 59 } },
  },
  recommendedColor: '#ffffff',
  applicableFits: ['unisex', 'women'] as const,
  defaultSide: 'front' as const,
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt', 'hoodie'] as const,
  collection: 'pastrmalijada' as const,
};

const KIDS_BASE = {
  overlayScale: 42,
  overlayPosition: { x: 50, y: 54 },
  recommendedColor: '#ffffff',
  applicableFits: ['kids'] as const,
  defaultSide: 'front' as const,
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt'] as const,
  productIds: ['tshirt-kids'] as const,
  collection: 'pastrmalijada' as const,
};

const MUG_BASE = {
  overlayScale: 48,
  overlayPosition: { x: 50, y: 46 },
  recommendedColor: '#ffffff',
  defaultSide: 'front' as const,
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['mug'] as const,
  productIds: ['mug-classic'] as const,
  collection: 'pastrmalijada' as const,
};

const BEER_BASE = {
  overlayScale: 38,
  overlayPosition: { x: 50, y: 48 },
  recommendedColor: '#e8f4fc',
  defaultSide: 'front' as const,
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['cup'] as const,
  productIds: ['cup-glass-beer'] as const,
  collection: 'pastrmalijada' as const,
};

const tees = [
  {
    id: 'pastrmalijada-ne-sum-debel',
    file: 'ne-sum-debel-tr.png',
    titleEn: "I'm not fat — training for Pastrmalijada",
    titleMk: 'Не сум дебел',
  },
  {
    id: 'pastrmalijada-stip-2026',
    file: 'stip-2026-tr.png',
    titleEn: 'Pastrmalijada Shtip 2026',
    titleMk: 'Пастрмалијада Штип 2026',
  },
  {
    id: 'pastrmalijada-team',
    file: 'team-tr.png',
    titleEn: 'Pastrmalija Team',
    titleMk: 'Пастрмалија Team',
  },
  {
    id: 'pastrmalijada-dietata',
    file: 'dietata-tr.png',
    titleEn: 'The diet can wait',
    titleMk: 'Диетата може да почека',
  },
  {
    id: 'pastrmalijada-spremen',
    file: 'spremen-tr.png',
    titleEn: 'Officially ready',
    titleMk: 'Официјално спремен',
  },
] as const;

export const pastrmalijadaPackTemplates: ProductDesignTemplate[] = [
  ...tees.map((item) => ({
    id: item.id,
    nameKey: item.id,
    titleEn: item.titleEn,
    titleMk: item.titleMk,
    overlayImage: `/NEW_DESIGNS/pastrmalijada/${item.file}`,
    ...TEE_BASE,
    productTypes: [...TEE_BASE.productTypes],
    applicableFits: [...TEE_BASE.applicableFits],
  })),
  {
    id: 'pastrmalijada-p-kako',
    nameKey: 'pastrmalijada-p-kako',
    titleEn: 'P as in pastrmalija',
    titleMk: 'П како пастрмалија',
    overlayImage: '/NEW_DESIGNS/pastrmalijada/p-kako-tr.png',
    ...KIDS_BASE,
    productTypes: [...KIDS_BASE.productTypes],
    productIds: [...KIDS_BASE.productIds],
    applicableFits: [...KIDS_BASE.applicableFits],
  },
  {
    id: 'pastrmalijada-mug',
    nameKey: 'pastrmalijada-mug',
    titleEn: 'Pastrmalijada',
    titleMk: 'Пастрмалијада',
    overlayImage: '/NEW_DESIGNS/pastrmalijada/mug-tr.png',
    ...MUG_BASE,
    productTypes: [...MUG_BASE.productTypes],
    productIds: [...MUG_BASE.productIds],
  },
  {
    id: 'pastrmalijada-beer',
    nameKey: 'pastrmalijada-beer',
    titleEn: 'Cheers, Shtip',
    titleMk: 'На здравје, Штип',
    overlayImage: '/NEW_DESIGNS/pastrmalijada/beer-tr.png',
    ...BEER_BASE,
    productTypes: [...BEER_BASE.productTypes],
    productIds: [...BEER_BASE.productIds],
  },
];
