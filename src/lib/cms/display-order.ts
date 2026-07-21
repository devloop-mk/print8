import { unstable_cache } from 'next/cache';
import {
  displayOrderDb,
  toOrderRecord,
  type DisplayOrderRecord,
} from '@/lib/db/display-order';

export const PRODUCT_DISPLAY_ORDER_CACHE_TAG = 'cms-product-display-order';
export const DESIGN_DISPLAY_ORDER_CACHE_TAG = 'cms-design-display-order';

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

export async function getProductDisplayOrderRecord(): Promise<Record<string, number>> {
  return toOrderRecord(await getProductDisplayOrderRowsCached());
}

export async function getDesignDisplayOrderRecord(): Promise<Record<string, number>> {
  return toOrderRecord(await getDesignDisplayOrderRowsCached());
}

export async function getProductDisplayOrderEntries(): Promise<DisplayOrderRecord[]> {
  return getProductDisplayOrderRowsCached();
}

export async function getDesignDisplayOrderEntries(): Promise<DisplayOrderRecord[]> {
  return getDesignDisplayOrderRowsCached();
}
