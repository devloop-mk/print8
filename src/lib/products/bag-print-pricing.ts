import type { Product } from '@/lib/data/catalog';

/** Garment-only cotton bag (no print). */
export const BAG_BLANK_PRICE = 250;

/** Cotton bag with print on front or back. */
export const BAG_PRINT_PRICE = 300;

export function isBagProduct(product: Product): boolean {
  return product.type === 'bag';
}

export function getBagUnitPrice(hasPrint: boolean): number {
  return hasPrint ? BAG_PRINT_PRICE : BAG_BLANK_PRICE;
}

export function getBagStartingPrice(): number {
  return BAG_BLANK_PRICE;
}

export function bagMetadataHasPrint(
  metadata: Record<string, string | number | boolean> | undefined,
): boolean {
  if (!metadata) return false;

  if (metadata.bagHasPrint === true || metadata.bagHasPrint === 'true') {
    return true;
  }

  for (const prefix of ['front', 'back']) {
    if (
      metadata[`${prefix}UploadedPhotos`] ||
      metadata[`${prefix}UploadedFileId`] ||
      metadata[`${prefix}PremadeDesignImage`] ||
      metadata[`${prefix}OverlaySvg`] ||
      metadata[`${prefix}OverlayRaster`] ||
      typeof metadata[`${prefix}Text`] === 'string' &&
        String(metadata[`${prefix}Text`]).trim()
    ) {
      return true;
    }
  }

  return false;
}

export function getBagPriceFromMetadata(
  metadata: Record<string, string | number | boolean> | undefined,
): number | null {
  if (!metadata || typeof metadata.productId !== 'string') return null;
  return getBagUnitPrice(bagMetadataHasPrint(metadata));
}
