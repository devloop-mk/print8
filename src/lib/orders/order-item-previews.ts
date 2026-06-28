import type { CheckoutInput } from '@/lib/validations/order';
import {
  PRODUCT_SIDES,
  getSideMetadataPrefix,
  SIDE_PREVIEW_CART_KEYS,
  type ProductSide,
} from '@/lib/products/product-sides';

export type OrderItem = CheckoutInput['items'][number];

const SIDE_LABELS: Record<ProductSide, string> = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
};

export function getOrderItemPreviewImages(
  item: OrderItem,
): { src: string; label: string }[] {
  const images: { src: string; label: string }[] = [];
  const seen = new Set<string>();

  for (const side of PRODUCT_SIDES) {
    const key = SIDE_PREVIEW_CART_KEYS[side];
    const src = item[key];
    if (typeof src === 'string' && src.length > 0 && !seen.has(src)) {
      images.push({ src, label: SIDE_LABELS[side] });
      seen.add(src);
    }
  }

  if (item.metadata) {
    for (const side of PRODUCT_SIDES) {
      const prefix = getSideMetadataPrefix(side);
      const premade = item.metadata[`${prefix}PremadeDesignImage`];
      if (
        typeof premade === 'string' &&
        premade.length > 0 &&
        !seen.has(premade)
      ) {
        images.push({ src: premade, label: `${SIDE_LABELS[side]} design` });
        seen.add(premade);
      }
    }
  }

  return images;
}

export function sanitizeOrderItemFilename(name: string, fallback: string): string {
  return name.replace(/[^\w\s-]/g, '').trim().slice(0, 40) || fallback;
}
