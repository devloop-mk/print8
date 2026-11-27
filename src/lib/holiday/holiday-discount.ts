import { getCartItemProduct } from '@/lib/cart/product-cart';
import {
  isHolidayProductKind,
  type HolidayPrizeKind,
  type HolidayProductKind,
} from '@/lib/holiday/workshop-config';
import type { ProductType } from '@/lib/data/catalog';

export type HolidayDiscountLine = {
  type?: string;
  price: number;
  quantity: number;
  metadata?: Record<string, string | number | boolean> | null;
};

export type HolidayCouponApplication = {
  prizeKind: HolidayPrizeKind;
  percent: number | null;
  boostPercent: number | null;
  boostKind: HolidayProductKind | null;
  matchingSubtotal: number;
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

const CATEGORY_IDS: Partial<Record<HolidayProductKind, readonly string[]>> = {
  cards: ['business-cards'],
  poster: ['a3-posters', 'posters'],
};

const COMPACT_META_KEYS = [
  'productId',
  'productType',
  'serviceId',
  'catalogServiceId',
  'category',
  'customDesignCategory',
  'printPackage',
] as const;

function metaString(
  metadata: HolidayDiscountLine['metadata'],
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function lineProductTypes(item: HolidayDiscountLine): readonly string[] {
  const types = new Set<string>();
  const product = getCartItemProduct({ metadata: item.metadata ?? undefined });
  if (product) types.add(product.type);
  const metaType = metaString(item.metadata, 'productType');
  if (metaType) types.add(metaType);
  return [...types];
}

function productIdMatchesKind(
  productId: string | null,
  kind: HolidayProductKind,
): boolean {
  if (!productId) return false;
  const id = productId.toLowerCase();
  switch (kind) {
    case 'tshirt':
      return id.startsWith('tshirt') || id.includes('t-shirt');
    case 'mug':
      return id.startsWith('mug') || id.startsWith('cup');
    case 'calendar':
      return id.startsWith('cal');
    case 'sticker':
      return id.startsWith('magnet') || id.startsWith('sticker');
    case 'gift':
      return id.startsWith('gift');
    default:
      return false;
  }
}

export function holidayBoostPercent(percent: number): number {
  return percent * 2;
}

export function holidayLineMatchesBoost(
  item: HolidayDiscountLine,
  kind: HolidayProductKind,
): boolean {
  const allowedTypes = PRODUCT_TYPES[kind];
  if (allowedTypes.length > 0) {
    if (lineProductTypes(item).some((type) => allowedTypes.includes(type as ProductType))) {
      return true;
    }
  }

  const productId = metaString(item.metadata, 'productId');
  if (productIdMatchesKind(productId, kind)) return true;

  if (kind === 'tshirt' && metaString(item.metadata, 'printPackage')) {
    const types = lineProductTypes(item);
    if (types.length === 0 || types.includes('t-shirt')) return true;
  }

  const serviceId =
    metaString(item.metadata, 'serviceId') ??
    metaString(item.metadata, 'catalogServiceId');
  if (serviceId && SERVICE_IDS[kind]?.includes(serviceId)) return true;

  const category =
    metaString(item.metadata, 'category') ??
    metaString(item.metadata, 'customDesignCategory');
  if (category && CATEGORY_IDS[kind]?.includes(category)) return true;

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

/** One free matching unit (cheapest line), used for mug / t-shirt giveaways. */
export function computeProductGiveawayDiscount(input: {
  kind: HolidayProductKind;
  items: readonly HolidayDiscountLine[];
  subtotalAmount: number;
  cap: number;
}): number {
  const subtotal = Math.max(0, input.subtotalAmount);
  let unit = Number.POSITIVE_INFINITY;
  for (const item of input.items) {
    if (!holidayLineMatchesBoost(item, input.kind)) continue;
    const price = Number(item.price);
    if (!Number.isFinite(price) || price <= 0) continue;
    unit = Math.min(unit, price);
  }
  if (!Number.isFinite(unit)) return 0;
  return Math.min(unit, Math.max(0, input.cap), subtotal);
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

export function compactHolidayDiscountLine(
  item: HolidayDiscountLine,
): HolidayDiscountLine {
  const metadata: Record<string, string | number | boolean> = {};
  for (const key of COMPACT_META_KEYS) {
    const value = item.metadata?.[key];
    if (typeof value === 'string' && value.length > 0) {
      metadata[key] = value;
    }
  }

  const product = getCartItemProduct({ metadata: item.metadata ?? undefined });
  if (product) {
    if (!metadata.productId) metadata.productId = product.id;
    if (!metadata.productType) metadata.productType = product.type;
  }

  return {
    type: item.type,
    price: item.price,
    quantity: item.quantity,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

export function holidayLineDiscountPercent(
  item: HolidayDiscountLine,
  holiday: Pick<HolidayCouponApplication, 'percent' | 'boostKind'> | null,
): number | null {
  if (!holiday?.percent) return null;
  if (holiday.boostKind && holidayLineMatchesBoost(item, holiday.boostKind)) {
    return holidayBoostPercent(holiday.percent);
  }
  return holiday.percent;
}

export function buildHolidayCouponApplication(input: {
  prizeKind: HolidayPrizeKind;
  percent: number | null;
  boostKind: HolidayProductKind | null;
  items: readonly HolidayDiscountLine[];
  subtotalAmount: number;
}): HolidayCouponApplication {
  const matchingSubtotal = Math.min(
    holidayMatchingSubtotal(input.items, input.boostKind),
    Math.max(0, input.subtotalAmount),
  );
  return {
    prizeKind: input.prizeKind,
    percent: input.percent,
    boostPercent: input.percent ? holidayBoostPercent(input.percent) : null,
    boostKind: input.boostKind,
    matchingSubtotal,
  };
}
