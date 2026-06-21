import {
  getProductDesignTemplates,
  getProductDesignTemplatesByCategory,
  type Product,
} from '@/lib/data/catalog';

export type ProductOffering = {
  imageDesignCount: number;
  textDesignCount: number;
  premadeCount: number;
  hasPremade: boolean;
  hasPhotoDesigns: boolean;
  hasTextTemplates: boolean;
};

export function getProductOffering(product: Product): ProductOffering {
  const imageDesignCount = getProductDesignTemplatesByCategory(
    product,
    'image-designs',
  ).length;
  const textDesignCount = getProductDesignTemplatesByCategory(
    product,
    'text-designs',
  ).length;
  const premadeCount = getProductDesignTemplates(product).length;

  return {
    imageDesignCount,
    textDesignCount,
    premadeCount,
    hasPremade: premadeCount > 0,
    hasPhotoDesigns: imageDesignCount > 0,
    hasTextTemplates: textDesignCount > 0,
  };
}
