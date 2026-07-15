import type { Product, ProductDesignTemplate } from '@/lib/data/catalog';
import type { CouplePackTemplate } from '@/lib/data/couple-pack';
import { partnerDesignToTemplate } from '@/lib/data/couple-pack';
import type { CartItem } from '@/components/cart/CartProvider';
import { buildPremadeDesignCartPayload } from '@/lib/products/premade-design-order';

export function getCouplePackPrice(product: Product): number {
  return product.basePrice * 2;
}

export function buildCouplePackCartItems({
  pack,
  product,
  color,
  partner1Size,
  partner2Size,
  name,
  capturedPreviews,
  designs,
}: {
  pack: CouplePackTemplate;
  product: Product;
  color: string;
  partner1Size: string;
  partner2Size: string;
  name: string;
  capturedPreviews?: [string | undefined, string | undefined];
  /** Optional admin-merged partner templates (preferred when editing in admin). */
  designs?: [ProductDesignTemplate, ProductDesignTemplate];
}): Omit<CartItem, 'id'>[] {
  const [partner1, partner2] = pack.partnerDesigns;
  const design1 = designs?.[0] ?? partnerDesignToTemplate(pack, partner1);
  const design2 = designs?.[1] ?? partnerDesignToTemplate(pack, partner2);

  return [
    buildPremadeDesignCartPayload({
      product,
      design: design1,
      color,
      size: partner1Size,
      name: `${name} — ${partner1.labelEn}`,
      price: product.basePrice,
      capturedPreview: capturedPreviews?.[0],
      quantity: 1,
    }),
    buildPremadeDesignCartPayload({
      product,
      design: design2,
      color,
      size: partner2Size,
      name: `${name} — ${partner2.labelEn}`,
      price: product.basePrice,
      capturedPreview: capturedPreviews?.[1],
      quantity: 1,
    }),
  ];
}
