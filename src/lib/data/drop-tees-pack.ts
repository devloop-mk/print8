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

const items = [
  {
    id: 'tee-train-insane',
    file: 'typography/train-insane.png',
    titleEn: 'Train insane or remain the same',
    titleMk: 'Train insane or remain the same',
    collection: 'typography',
  },
  {
    id: 'tee-im-a-programmer',
    file: 'typography/im-a-programmer.png',
    titleEn: "Don't worry, I'm a programmer",
    titleMk: 'Не се секирај, јас сум програмер',
    collection: 'typography',
  },
  {
    id: 'tee-stip-flag-stack',
    file: 'local-mk/stip-flag-stack.png',
    titleEn: 'Shtip flag stack',
    titleMk: 'Штип',
    collection: 'local-mk',
  },
] as const;

export const dropTeePackTemplates: ProductDesignTemplate[] = items.map((item) => ({
  id: item.id,
  nameKey: item.id,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: `/NEW_DESIGNS/${item.file}`,
  printMasterImage: `masters/${item.file}`,
  collection: item.collection,
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));
