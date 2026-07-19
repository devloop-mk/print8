import type { CheckoutInput } from '@/lib/validations/order';
import { putOrderPrintObject } from '@/lib/storage/object-storage';

const INLINE_SVG_KEYS = ['svgFrontContent', 'svgBackContent'] as const;
const STORED_SVG_KEYS = {
  svgFrontContent: 'svgFrontStoredName',
  svgBackContent: 'svgBackStoredName',
} as const;

function safeOrderFolder(orderNumber: string) {
  return orderNumber.replace(/[^\w.-]+/g, '_');
}

/**
 * Upload print-ready SVG blobs to object storage and keep only storage keys
 * in order item metadata (so Postgres `orders.items` stays small).
 */
export async function persistOrderPrintSvgs(
  orderNumber: string,
  items: CheckoutInput['items'],
): Promise<CheckoutInput['items']> {
  const folder = safeOrderFolder(orderNumber);

  return Promise.all(
    items.map(async (item, itemIndex) => {
      const meta = item.metadata;
      if (!meta || meta.orderType !== 'svg-template') return item;

      const nextMeta: Record<string, string | number | boolean> = { ...meta };
      let changed = false;

      for (const contentKey of INLINE_SVG_KEYS) {
        const content = nextMeta[contentKey];
        if (typeof content !== 'string' || !content.trim()) continue;

        const side = contentKey === 'svgFrontContent' ? 'front' : 'back';
        const storedName = `${folder}/item-${itemIndex + 1}-${side}.svg`;

        await putOrderPrintObject(
          storedName,
          Buffer.from(content, 'utf8'),
          'image/svg+xml',
        );

        nextMeta[STORED_SVG_KEYS[contentKey]] = storedName;
        delete nextMeta[contentKey];
        changed = true;
      }

      if (!changed) return item;
      return { ...item, metadata: nextMeta };
    }),
  );
}
