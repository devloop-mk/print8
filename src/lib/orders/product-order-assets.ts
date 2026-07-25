import type { CheckoutInput } from '@/lib/validations/order';
import type { ProductSide } from '@/lib/data/catalog';
import {
  PRODUCT_SIDES,
  getSideMetadataPrefix,
  SIDE_PRINT_PNG_CART_KEYS,
} from '@/lib/products/product-sides';
import { isDataUrl } from '@/lib/storage/cart-storage';
import {
  parseTextLayersFromMetadata,
  type PlacedTextLayer,
} from '@/lib/products/text-layers';
import type { SideDesign } from '@/lib/products/design-state';
import { sanitizeOrderItemFilename } from '@/lib/orders/order-item-previews';
import { orderItemSideUsesPremadeMasterForProduction } from '@/lib/products/premade-artwork-source';

export type OrderItem = CheckoutInput['items'][number];

export type ProductPrintPngRef = {
  side: ProductSide;
  filename: string;
  /** Inline data URL (legacy / pre-upload) */
  pngDataUrl?: string;
  /** Object-storage key under `order-prints/` */
  storedName?: string;
  /** Catalog print master for ready-design orders */
  externalUrl?: string;
};

const SIDE_LABELS: Record<ProductSide, string> = {
  front: 'Front',
  back: 'Back',
  left: 'Left',
  right: 'Right',
};

function sidePrintPngStoredKey(side: ProductSide): string {
  return `${getSideMetadataPrefix(side)}PrintPngStoredName`;
}

function safePrintPngFilename(itemName: string, side: ProductSide): string {
  const safeName =
    sanitizeOrderItemFilename(itemName, 'design').replace(/\s+/g, '-') ||
    'design';
  return `${safeName}-${side}-print.png`;
}

/** List print-ready PNG refs for a product line item (customizer orders). */
export function listProductPrintPngRefsFromItem(
  item: OrderItem,
): ProductPrintPngRef[] {
  if (item.type !== 'product') return [];

  const files: ProductPrintPngRef[] = [];
  const meta = item.metadata;

  for (const side of PRODUCT_SIDES) {
    const storedName = meta?.[sidePrintPngStoredKey(side)];
    if (typeof storedName === 'string' && storedName.trim()) {
      files.push({
        side,
        filename: safePrintPngFilename(item.name, side),
        storedName: storedName.trim(),
      });
      continue;
    }

    const inlineKey = SIDE_PRINT_PNG_CART_KEYS[side];
    const inline = item[inlineKey];
    if (typeof inline === 'string' && isDataUrl(inline)) {
      files.push({
        side,
        filename: safePrintPngFilename(item.name, side),
        pngDataUrl: inline,
      });
      continue;
    }

    if (orderItemSideUsesPremadeMasterForProduction(meta, side)) {
      continue;
    }

    const premadeRaw = meta?.[`${getSideMetadataPrefix(side)}PremadeDesignImage`];
    if (typeof premadeRaw === 'string') {
      const premadeUrl = premadeRaw.trim();
      if (premadeUrl && !isDataUrl(premadeUrl)) {
        files.push({
          side,
          filename: safePrintPngFilename(item.name, side),
          externalUrl: premadeUrl,
        });
      }
    }
  }

  return files;
}

export type OrderItemTextSide = {
  side: ProductSide;
  label: string;
  layers: PlacedTextLayer[];
};

/** Parse visible text layers per side for admin / production display. */
export function getOrderItemTextSides(item: OrderItem): OrderItemTextSide[] {
  if (!item.metadata || item.type !== 'product') return [];

  const sides: OrderItemTextSide[] = [];

  for (const side of PRODUCT_SIDES) {
    const prefix = getSideMetadataPrefix(side);
    const flatDesign = {
      customText: String(item.metadata[`${prefix}CustomText`] ?? ''),
      customTextColor: String(item.metadata[`${prefix}CustomTextColor`] ?? ''),
      customTextSize: Number(item.metadata[`${prefix}CustomTextSize`] ?? 18),
      customTextPosition: {
        x: Number(item.metadata[`${prefix}CustomTextPositionX`] ?? 50),
        y: Number(item.metadata[`${prefix}CustomTextPositionY`] ?? 25),
      },
      customTextFontWeight: Number(
        item.metadata[`${prefix}CustomTextFontWeight`] ?? 700,
      ),
      customTextLetterSpacing: String(
        item.metadata[`${prefix}CustomTextLetterSpacing`] ?? '0.02em',
      ),
      customTextLineHeight: Number(
        item.metadata[`${prefix}CustomTextLineHeight`] ?? 1.2,
      ),
      customTextShadow: String(
        item.metadata[`${prefix}CustomTextShadow`] ?? 'none',
      ),
    } satisfies Pick<
      SideDesign,
      | 'customText'
      | 'customTextColor'
      | 'customTextSize'
      | 'customTextPosition'
      | 'customTextFontWeight'
      | 'customTextLetterSpacing'
      | 'customTextLineHeight'
      | 'customTextShadow'
    >;

    const layers = parseTextLayersFromMetadata(
      item.metadata,
      prefix,
      flatDesign,
    ).filter((layer) => layer.text.trim());

    if (layers.length === 0) continue;

    sides.push({
      side,
      label: SIDE_LABELS[side],
      layers,
    });
  }

  return sides;
}
