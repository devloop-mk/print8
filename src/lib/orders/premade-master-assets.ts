import type { ProductSide } from '@/lib/data/catalog';
import { PRODUCT_SIDES } from '@/lib/products/product-sides';
import {
  getPremadeMasterStoragePath,
  orderItemSideUsesPremadeMasterForProduction,
} from '@/lib/products/premade-artwork-source';
import { resolveProductDesignTemplate } from '@/lib/products/resolve-product-design-template';
import { getSideMetadataPrefix } from '@/lib/products/product-sides';
import { resolveAssetUrl, resolveMasterAssetUrl } from '@/lib/storage/asset-url';
import { sanitizeOrderItemFilename } from '@/lib/orders/order-item-previews';
import type { OrderItem } from '@/lib/orders/product-order-assets';

export type PremadeMasterAssetRef = {
  side: ProductSide;
  filename: string;
  /** Public CDN / catalog URL for the untouched premade master. */
  masterUrl: string;
  /** User only moved/resized the premade art — prefer this file for print. */
  originalArtworkOnly: boolean;
  /** Production uses cloud master + mockup preview (no auto print PNG). */
  productionUsesMaster: boolean;
};

function masterPathToPublicUrl(path: string): string {
  const normalized = path.replace(/^\//, '');
  if (normalized.startsWith('masters/')) {
    return resolveMasterAssetUrl(path);
  }
  return resolveAssetUrl(path);
}

function safeMasterFilename(itemName: string, side: ProductSide): string {
  const safeName =
    sanitizeOrderItemFilename(itemName, 'design').replace(/\s+/g, '-') ||
    'design';
  return `${safeName}-${side}-original.png`;
}

async function resolveMasterPathForSide(
  item: OrderItem,
  side: ProductSide,
): Promise<string | null> {
  const prefix = getSideMetadataPrefix(side);
  const meta = item.metadata;
  const fromMeta = meta?.[`${prefix}PremadeMasterImage`];
  if (typeof fromMeta === 'string' && fromMeta.trim()) {
    return fromMeta.trim();
  }

  const premadeDesignId = meta?.[`${prefix}PremadeDesignId`];
  const designTemplateId = meta?.designTemplateId;
  const designId =
    (typeof premadeDesignId === 'string' ? premadeDesignId : null) ??
    (typeof designTemplateId === 'string' ? designTemplateId : null);

  if (!designId) return null;

  const template = await resolveProductDesignTemplate(designId);
  if (!template) return null;

  return getPremadeMasterStoragePath(template, side);
}

/** Read premade master refs stored on the order item (no async template lookup). */
export function listPremadeMasterRefsFromOrderMetadata(
  item: OrderItem,
): PremadeMasterAssetRef[] {
  if (item.type !== 'product' || !item.metadata) return [];

  const refs: PremadeMasterAssetRef[] = [];

  for (const side of PRODUCT_SIDES) {
    const prefix = getSideMetadataPrefix(side);
    const masterPath = item.metadata[`${prefix}PremadeMasterImage`];
    if (typeof masterPath !== 'string' || !masterPath.trim()) continue;

    const hasPremade =
      typeof item.metadata[`${prefix}PremadeDesignId`] === 'string' ||
      typeof item.metadata.designTemplateId === 'string';
    if (!hasPremade) continue;

    refs.push({
      side,
      filename: safeMasterFilename(item.name, side),
      masterUrl: masterPathToPublicUrl(masterPath.trim()),
      originalArtworkOnly:
        item.metadata[`${prefix}PremadeOriginalArtworkOnly`] === true,
      productionUsesMaster: orderItemSideUsesPremadeMasterForProduction(
        item.metadata,
        side,
      ),
    });
  }

  return refs;
}

/** Admin download refs for premade masters (metadata + template fallback). */
export async function listPremadeMasterAssetRefsFromItem(
  item: OrderItem,
): Promise<PremadeMasterAssetRef[]> {
  const fromMetadata = listPremadeMasterRefsFromOrderMetadata(item);
  if (fromMetadata.length > 0) return fromMetadata;

  if (item.type !== 'product' || !item.metadata) return [];

  const sides: ProductSide[] = ['front', 'back', 'left', 'right'];
  const refs: PremadeMasterAssetRef[] = [];

  for (const side of sides) {
    const prefix = getSideMetadataPrefix(side);
    const designId = item.metadata[`${prefix}PremadeDesignId`];
    const masterMeta = item.metadata[`${prefix}PremadeMasterImage`];
    const originalOnly = item.metadata[`${prefix}PremadeOriginalArtworkOnly`];

    if (
      typeof designId !== 'string' &&
      typeof masterMeta !== 'string' &&
      typeof item.metadata.designTemplateId !== 'string'
    ) {
      continue;
    }

    const masterPath = await resolveMasterPathForSide(item, side);
    if (!masterPath) continue;

    refs.push({
      side,
      filename: safeMasterFilename(item.name, side),
      masterUrl: masterPathToPublicUrl(masterPath),
      originalArtworkOnly: originalOnly === true,
      productionUsesMaster: orderItemSideUsesPremadeMasterForProduction(
        item.metadata,
        side,
      ),
    });
  }

  return refs;
}
