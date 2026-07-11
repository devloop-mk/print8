import { unstable_cache } from 'next/cache';
import {
  productDesignTemplates as staticProductDesignTemplates,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { managedProductDesignsDb } from '@/lib/db/managed-product-designs';
import { mergeProductDesignCatalog } from '@/lib/products/merge-product-designs';

export const PRODUCT_DESIGNS_CACHE_TAG = 'product-designs';

async function loadMergedProductDesignTemplates(): Promise<ProductDesignTemplate[]> {
  const managed = await managedProductDesignsDb.list();
  return mergeProductDesignCatalog(staticProductDesignTemplates, managed);
}

export const getMergedProductDesignTemplates = unstable_cache(
  loadMergedProductDesignTemplates,
  ['merged-product-design-templates'],
  {
    revalidate: 300,
    tags: [PRODUCT_DESIGNS_CACHE_TAG],
  },
);

export async function getMergedProductDesignTemplate(
  id: string,
): Promise<ProductDesignTemplate | null> {
  const templates = await getMergedProductDesignTemplates();
  return templates.find((template) => template.id === id) ?? null;
}

/** Synchronous fallback for client-only code paths (static catalog only). */
export function getStaticProductDesignTemplates(): ProductDesignTemplate[] {
  return staticProductDesignTemplates;
}
