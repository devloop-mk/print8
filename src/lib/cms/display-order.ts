import { unstable_cache } from 'next/cache';
import {
  displayOrderDb,
  toOrderRecord,
  type DisplayOrderRecord,
} from '@/lib/db/display-order';
import { resolveProductId } from '@/lib/products/product-id-aliases';

export const PRODUCT_DISPLAY_ORDER_CACHE_TAG = 'cms-product-display-order';
export const DESIGN_DISPLAY_ORDER_CACHE_TAG = 'cms-design-display-order';
export const PRINT_DESIGN_DISPLAY_ORDER_CACHE_TAG = 'cms-print-design-display-order';

const getProductDisplayOrderRowsCached = unstable_cache(
  async (): Promise<DisplayOrderRecord[]> => displayOrderDb.products.list(),
  ['cms-product-display-order-rows'],
  {
    revalidate: 1800,
    tags: [PRODUCT_DISPLAY_ORDER_CACHE_TAG],
  },
);

const getDesignDisplayOrderRowsCached = unstable_cache(
  async (): Promise<DisplayOrderRecord[]> => displayOrderDb.designs.list(),
  ['cms-design-display-order-rows'],
  {
    revalidate: 1800,
    tags: [DESIGN_DISPLAY_ORDER_CACHE_TAG],
  },
);

const getPrintDesignDisplayOrderRowsCached = unstable_cache(
  async (): Promise<DisplayOrderRecord[]> => displayOrderDb.printDesigns.list(),
  ['cms-print-design-display-order-rows'],
  {
    revalidate: 1800,
    tags: [PRINT_DESIGN_DISPLAY_ORDER_CACHE_TAG],
  },
);

/** Map legacy product ids (e.g. tshirt-basic-white) onto current catalog ids. */
function toCanonicalProductOrderRecord(
  entries: DisplayOrderRecord[],
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const entry of entries) {
    const id = resolveProductId(entry.id);
    if (result[id] === undefined || entry.sortOrder < result[id]) {
      result[id] = entry.sortOrder;
    }
  }
  return result;
}

export async function getProductDisplayOrderRecord(): Promise<Record<string, number>> {
  return toCanonicalProductOrderRecord(await getProductDisplayOrderRowsCached());
}

export async function getDesignDisplayOrderRecord(): Promise<Record<string, number>> {
  return toOrderRecord(await getDesignDisplayOrderRowsCached());
}

export async function getPrintDesignDisplayOrderRecord(): Promise<Record<string, number>> {
  return toOrderRecord(await getPrintDesignDisplayOrderRowsCached());
}

export async function getProductDisplayOrderEntries(): Promise<DisplayOrderRecord[]> {
  return getProductDisplayOrderRowsCached();
}

export async function getDesignDisplayOrderEntries(): Promise<DisplayOrderRecord[]> {
  return getDesignDisplayOrderRowsCached();
}

export async function getPrintDesignDisplayOrderEntries(): Promise<DisplayOrderRecord[]> {
  return getPrintDesignDisplayOrderRowsCached();
}
