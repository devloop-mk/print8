import {
  getProductDesignTemplates,
  getProductDesignTemplatesByCategory,
  type Product,
} from '@/lib/data/catalog';
import type { ProductNavCategoryId } from '@/lib/products/product-nav';
import { getProductVisibilityRecord } from '@/lib/cms/product-visibility';
import {
  getProductsForCategoryWithVisibility,
} from '@/lib/products/product-nav-catalog';

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

export type CategoryOffering = {
  imageDesignCount: number;
  textDesignCount: number;
  hasPhotoDesigns: boolean;
  hasTextTemplates: boolean;
};

export function getCategoryOfferingWithVisibility(
  categoryId: ProductNavCategoryId,
  visibility: Record<string, boolean>,
): CategoryOffering {
  let imageDesignCount = 0;
  let textDesignCount = 0;

  for (const product of getProductsForCategoryWithVisibility(
    categoryId,
    visibility,
  )) {
    const offering = getProductOffering(product);
    imageDesignCount += offering.imageDesignCount;
    textDesignCount += offering.textDesignCount;
  }

  return {
    imageDesignCount,
    textDesignCount,
    hasPhotoDesigns: imageDesignCount > 0,
    hasTextTemplates: textDesignCount > 0,
  };
}

export async function getCategoryOffering(
  categoryId: ProductNavCategoryId,
): Promise<CategoryOffering> {
  const visibility = await getProductVisibilityRecord();
  return getCategoryOfferingWithVisibility(categoryId, visibility);
}

export function categoryHasPremadeDesigns(offering: CategoryOffering): boolean {
  return offering.hasPhotoDesigns || offering.hasTextTemplates;
}

/** @deprecated Use categoryHasPremadeDesigns */
export function categoryNeedsPathChooser(offering: CategoryOffering): boolean {
  return categoryHasPremadeDesigns(offering);
}
