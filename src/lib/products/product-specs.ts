import type { ProductType } from '@/lib/data/catalog';

export interface ProductSpec {
  materialKey: string;
  ecoFriendlyKey: string;
  fitKey: string;
  careKey?: string;
}

const PRODUCT_SPECS: Partial<Record<ProductType, ProductSpec>> = {
  't-shirt': {
    materialKey: 'cotton100',
    ecoFriendlyKey: 'ecoFriendlyInk',
    fitKey: 'regularFit',
    careKey: 'machineWash30',
  },
  hoodie: {
    materialKey: 'cottonBlend',
    ecoFriendlyKey: 'ecoFriendlyInk',
    fitKey: 'relaxedFit',
    careKey: 'machineWash30',
  },
  bodysuit: {
    materialKey: 'organicCotton',
    ecoFriendlyKey: 'ecoFriendlyInk',
    fitKey: 'babyFit',
    careKey: 'machineWash30',
  },
  cap: {
    materialKey: 'cottonTwil',
    ecoFriendlyKey: 'ecoFriendlyInk',
    fitKey: 'adjustableFit',
  },
  bag: {
    materialKey: 'cottonCanvas',
    ecoFriendlyKey: 'ecoFriendlyInk',
    fitKey: 'oneSize',
  },
  mug: {
    materialKey: 'ceramic',
    ecoFriendlyKey: 'dishwasherSafe',
    fitKey: 'standardMug',
  },
  cup: {
    materialKey: 'ceramic',
    ecoFriendlyKey: 'dishwasherSafe',
    fitKey: 'standardCup',
  },
  thermos: {
    materialKey: 'stainlessSteel',
    ecoFriendlyKey: 'bpaFree',
    fitKey: 'standardThermos',
  },
};

export function getProductSpecs(type: ProductType): ProductSpec | null {
  return PRODUCT_SPECS[type] ?? null;
}
