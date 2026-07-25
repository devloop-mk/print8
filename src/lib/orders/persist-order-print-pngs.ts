import type { CheckoutInput } from '@/lib/validations/order';
import type { ProductSide } from '@/lib/data/catalog';
import { getUploadObject, putOrderPrintObject } from '@/lib/storage/object-storage';
import { isDataUrl } from '@/lib/storage/cart-storage';
import { getUploadedFile } from '@/lib/upload';
import {
  PRODUCT_SIDES,
  getSideMetadataPrefix,
  SIDE_PRINT_PNG_CART_KEYS,
} from '@/lib/products/product-sides';

function sidePrintPngFileIdKey(side: ProductSide): string {
  return `${getSideMetadataPrefix(side)}PrintPngFileId`;
}

function safeOrderFolder(orderNumber: string) {
  return orderNumber.replace(/[^\w.-]+/g, '_');
}

function parsePngDataUrl(dataUrl: string): Buffer | null {
  const match = dataUrl.match(/^data:image\/png;base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[1], 'base64');
}

function sidePrintPngStoredKey(side: ProductSide): string {
  return `${getSideMetadataPrefix(side)}PrintPngStoredName`;
}

/**
 * Upload print-ready PNG blobs to object storage and keep only storage keys
 * in order item metadata (so Postgres `orders.items` stays small).
 */
export async function persistOrderPrintPngs(
  orderNumber: string,
  items: CheckoutInput['items'],
): Promise<CheckoutInput['items']> {
  const folder = safeOrderFolder(orderNumber);

  return Promise.all(
    items.map(async (item, itemIndex) => {
      if (item.type !== 'product') return item;

      let nextItem = { ...item };
      let nextMeta: Record<string, string | number | boolean> | undefined =
        item.metadata ? { ...item.metadata } : undefined;
      let changed = false;

      for (const side of PRODUCT_SIDES) {
        const storedKey = sidePrintPngStoredKey(side);
        if (typeof nextMeta?.[storedKey] === 'string' && nextMeta[storedKey]) {
          continue;
        }

        const fileIdKey = sidePrintPngFileIdKey(side);
        const fileId = nextMeta?.[fileIdKey];
        if (typeof fileId === 'string' && fileId.trim()) {
          try {
            const uploaded = await getUploadedFile(fileId.trim());
            if (uploaded) {
              const sourceName =
                uploaded.originalStoredName ?? uploaded.storedName;
              const { body } = await getUploadObject(sourceName);
              const storedName = `${folder}/item-${itemIndex + 1}-${side}-print.png`;
              await putOrderPrintObject(storedName, body, 'image/png');

              nextMeta = nextMeta ?? {};
              nextMeta[storedKey] = storedName;
              delete nextMeta[fileIdKey];
              changed = true;
            }
          } catch (err) {
            console.error(
              `[orders] print PNG persist failed (fileId ${fileId}):`,
              err,
            );
          }
          continue;
        }

        const inlineKey = SIDE_PRINT_PNG_CART_KEYS[side];
        const inline = nextItem[inlineKey];
        if (typeof inline !== 'string' || !isDataUrl(inline)) continue;

        const body = parsePngDataUrl(inline);
        if (!body) continue;

        try {
          const storedName = `${folder}/item-${itemIndex + 1}-${side}-print.png`;
          await putOrderPrintObject(storedName, body, 'image/png');

          nextMeta = nextMeta ?? {};
          nextMeta[sidePrintPngStoredKey(side)] = storedName;
          const { [inlineKey]: _removed, ...restItem } = nextItem;
          nextItem = restItem;
          changed = true;
        } catch (err) {
          console.error(
            `[orders] inline print PNG persist failed (${side}):`,
            err,
          );
        }
      }

      if (!changed) return item;
      return {
        ...nextItem,
        metadata: nextMeta,
      };
    }),
  );
}
