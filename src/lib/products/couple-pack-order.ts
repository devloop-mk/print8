import type { Product, ProductDesignTemplate } from '@/lib/data/catalog';
import type { CouplePackTemplate } from '@/lib/data/couple-pack';
import { partnerDesignToTemplate } from '@/lib/data/couple-pack';
import type { CartItem } from '@/lib/cart/types';
import {
  buildPremadeDesignCartPayload,
  getPremadeDesignUnitPrice,
} from '@/lib/products/premade-design-order';

/** Sum of each partner shirt's tee print-package price (or base × 2 for non-tees). */
export function getCouplePackPrice(
  product: Product,
  pack: CouplePackTemplate,
  designs?: [ProductDesignTemplate, ProductDesignTemplate],
): number {
  const [partner1, partner2] = pack.partnerDesigns;
  const design1 = designs?.[0] ?? partnerDesignToTemplate(pack, partner1);
  const design2 = designs?.[1] ?? partnerDesignToTemplate(pack, partner2);
  return (
    getPremadeDesignUnitPrice(product, design1) +
    getPremadeDesignUnitPrice(product, design2)
  );
}

export function buildCouplePackCartItems({
  pack,
  product,
  partner1Color,
  partner2Color,
  partner1Size,
  partner2Size,
  name,
  capturedPreviews,
  designs,
}: {
  pack: CouplePackTemplate;
  product: Product;
  partner1Color: string;
  partner2Color: string;
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
      color: partner1Color,
      size: partner1Size,
      name: `${name} — ${partner1.labelEn}`,
      capturedPreview: capturedPreviews?.[0],
      quantity: 1,
    }),
    buildPremadeDesignCartPayload({
      product,
      design: design2,
      color: partner2Color,
      size: partner2Size,
      name: `${name} — ${partner2.labelEn}`,
      capturedPreview: capturedPreviews?.[1],
      quantity: 1,
    }),
  ];
}
