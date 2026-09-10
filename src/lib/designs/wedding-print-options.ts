import type { CartItem } from '@/lib/cart/types';

/** Invitation formats from Print8 vizit-pokani v16. */
export const WEDDING_PRINT_SIZE_OPTIONS = [
  '10x15',
  '12x17',
  'a5',
  'dl',
  '15x15',
] as const;
export type WeddingPrintSize = (typeof WEDDING_PRINT_SIZE_OPTIONS)[number];

export const WEDDING_PRINT_SIDES_OPTIONS = ['single', 'double'] as const;
export type WeddingPrintSides = (typeof WEDDING_PRINT_SIDES_OPTIONS)[number];

export const WEDDING_MIN_QUANTITY = 20;
export const WEDDING_MAX_QUANTITY = 999;

type InvitationQuantityTier = '20-49' | '50-99' | '100+';

/** Per-piece MKD by [20–49, 50–99, 100+] from the price list. */
const UNIT_PRICES: Record<
  WeddingPrintSize,
  Record<WeddingPrintSides, readonly [number, number, number]>
> = {
  '10x15': {
    single: [15, 12, 8],
    double: [18, 15, 10],
  },
  '12x17': {
    single: [18, 15, 10],
    double: [20, 17, 12],
  },
  a5: {
    single: [20, 17, 12],
    double: [22, 19, 14],
  },
  dl: {
    single: [18, 15, 10],
    double: [20, 17, 12],
  },
  '15x15': {
    single: [20, 17, 12],
    double: [22, 19, 14],
  },
};

/** 100-invitation packages (single-sided, basic design included). */
const PACKAGE_100_TOTALS: Partial<Record<WeddingPrintSize, number>> = {
  '10x15': 800,
  '12x17': 1000,
  a5: 1200,
  dl: 1000,
  '15x15': 1200,
};

export const DEFAULT_WEDDING_PRINT_OPTIONS: WeddingPrintOptions = {
  size: '10x15',
  sides: 'single',
  quantity: 50,
};

export interface WeddingPrintOptions {
  size: WeddingPrintSize;
  sides: WeddingPrintSides;
  quantity: number;
}

export function isWeddingPrintSize(value: unknown): value is WeddingPrintSize {
  return (
    typeof value === 'string' &&
    (WEDDING_PRINT_SIZE_OPTIONS as readonly string[]).includes(value)
  );
}

export function isWeddingPrintSides(
  value: unknown,
): value is WeddingPrintSides {
  return (
    typeof value === 'string' &&
    (WEDDING_PRINT_SIDES_OPTIONS as readonly string[]).includes(value)
  );
}

/** Maps legacy cart metadata to current sizes. */
export function normalizeWeddingPrintSize(value: unknown): WeddingPrintSize {
  if (value === '13x18') return '12x17';
  if (isWeddingPrintSize(value)) return value;
  return DEFAULT_WEDDING_PRINT_OPTIONS.size;
}

export function clampWeddingQuantity(value: number): number {
  return Math.min(
    WEDDING_MAX_QUANTITY,
    Math.max(WEDDING_MIN_QUANTITY, Math.round(value)),
  );
}

export function getInvitationQuantityTier(
  quantity: number,
): InvitationQuantityTier {
  const q = clampWeddingQuantity(quantity);
  if (q >= 100) return '100+';
  if (q >= 50) return '50-99';
  return '20-49';
}

export function getWeddingPricePerInvitation(
  size: WeddingPrintSize,
  sides: WeddingPrintSides,
  quantity: number,
): number {
  const tier = getInvitationQuantityTier(quantity);
  const tierIndex = tier === '20-49' ? 0 : tier === '50-99' ? 1 : 2;
  return UNIT_PRICES[size][sides][tierIndex];
}

export function parseWeddingPrintOptions(
  metadata?: CartItem['metadata'],
): WeddingPrintOptions {
  const quantity =
    typeof metadata?.weddingQuantity === 'number' &&
    Number.isFinite(metadata.weddingQuantity)
      ? clampWeddingQuantity(metadata.weddingQuantity)
      : DEFAULT_WEDDING_PRINT_OPTIONS.quantity;

  const sides = isWeddingPrintSides(metadata?.weddingSides)
    ? metadata.weddingSides
    : DEFAULT_WEDDING_PRINT_OPTIONS.sides;

  return {
    size: normalizeWeddingPrintSize(metadata?.weddingSize),
    sides,
    quantity,
  };
}

export function calculateWeddingPrintPrice(
  options: WeddingPrintOptions,
  designFee = 0,
) {
  const quantity = clampWeddingQuantity(options.quantity);
  const pricePerInvitation = getWeddingPricePerInvitation(
    options.size,
    options.sides,
    quantity,
  );

  let printTotal = quantity * pricePerInvitation;

  const packageTotal = PACKAGE_100_TOTALS[options.size];
  if (
    quantity === 100 &&
    options.sides === 'single' &&
    packageTotal !== undefined
  ) {
    printTotal = packageTotal;
  }

  return {
    designFee,
    printTotal,
    pricePerInvitation:
      quantity > 0 ? Math.round(printTotal / quantity) : pricePerInvitation,
    total: designFee + printTotal,
  };
}

export function weddingPrintMetadata(
  options: WeddingPrintOptions,
  price: ReturnType<typeof calculateWeddingPrintPrice>,
): Record<string, string | number | boolean> {
  return {
    weddingSize: options.size,
    weddingSides: options.sides,
    weddingQuantity: options.quantity,
    weddingDesignFee: price.designFee,
    weddingPrintTotal: price.printTotal,
    weddingPricePerInvitation: price.pricePerInvitation,
  };
}

export function hasWeddingPrintOptions(metadata?: CartItem['metadata']): boolean {
  const size = metadata?.weddingSize;
  return (
    size === 'a5' ||
    size === '13x18' ||
    isWeddingPrintSize(size)
  );
}

export function isWeddingPrintCartItem(item: CartItem): boolean {
  return (
    item.type === 'design' &&
    (item.metadata?.category === 'wedding' ||
      item.metadata?.category === 'birthday') &&
    hasWeddingPrintOptions(item.metadata)
  );
}
