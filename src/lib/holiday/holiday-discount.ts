import { getCartItemProduct } from '@/lib/cart/product-cart';
import {
  isHolidayProductKind,
  type HolidayProductKind,
} from '@/lib/holiday/workshop-config';
import type { ProductType } from '@/lib/data/catalog';

export type HolidayDiscountLine = {
  type?: string;
  price: number;
  quantity: number;
  metadata?: Record<string, string | number | boolean> | null;
};

const PRODUCT_TYPES: Record<HolidayProductKind, readonly ProductType[]> = {
  mug: ['mug', 'cup'],
  tshirt: ['t-shirt'],
  calendar: [],
  cards: [],
  poster: [],
  sticker: ['magnet'],
  gift: ['gift-box', 'gift-set'],
};

const SERVICE_IDS: Partial<Record<HolidayProductKind, readonly string[]>> = {
  cards: ['business-cards'],
  poster: ['a3-posters'],
};

function metaString(
  metadata: HolidayDiscountLine['metadata'],
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function holidayBoostPercent(percent: number): number {
  return percent * 2;
}

export function holidayLineMatchesBoost(
  item: HolidayDiscountLine,
  kind: HolidayProductKind,
): boolean {
  const product = getCartItemProduct({ metadata: item.metadata ?? undefined });
  if (product && PRODUCT_TYPES[kind].includes(product.type)) return true;

  const productId = metaString(item.metadata, 'productId');
  if (kind === 'calendar' && productId?.startsWith('cal')) return true;

  const serviceId =
    metaString(item.metadata, 'serviceId') ??
    metaString(item.metadata, 'catalogServiceId');
  if (serviceId && SERVICE_IDS[kind]?.includes(serviceId)) return true;

  const category =
    metaString(item.metadata, 'category') ??
    metaString(item.metadata, 'customDesignCategory');
  if (kind === 'cards' && category === 'business-cards') return true;

  return false;
}

export function holidayMatchingSubtotal(
  items: readonly HolidayDiscountLine[],
  kind: HolidayProductKind | null | undefined,
): number {
  if (!kind || !isHolidayProductKind(kind)) return 0;
  return items.reduce((sum, item) => {
    if (!holidayLineMatchesBoost(item, kind)) return sum;
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    if (!Number.isFinite(price) || !Number.isFinite(quantity)) return sum;
    return sum + Math.max(0, price) * Math.max(0, quantity);
  }, 0);
}

export function computeHolidayPercentDiscount(input: {
  percent: number;
  boostKind: HolidayProductKind | null | undefined;
  items: readonly HolidayDiscountLine[];
  subtotalAmount: number;
  cap: number;
}): number {
  const subtotal = Math.max(0, input.subtotalAmount);
  const matching = Math.min(holidayMatchingSubtotal(input.items, input.boostKind), subtotal);
  const rest = Math.max(0, subtotal - matching);
  const rate = input.percent / 100;
  const raw = rest * rate + matching * rate * 2;
  return Math.min(raw, Math.max(0, input.cap), subtotal);
}
