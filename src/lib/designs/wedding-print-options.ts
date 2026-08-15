import type { CartItem } from '@/lib/cart/types';

/** Wedding invitation print sizes. */
export const WEDDING_PRINT_SIZE_OPTIONS = ['13x18', '10x15'] as const;
export type WeddingPrintSize = (typeof WEDDING_PRINT_SIZE_OPTIONS)[number];

export const WEDDING_DESIGN_FEE = 100;

/** Per-invitation print price by size — larger format costs more. */
export const WEDDING_PRICE_PER_INVITATION_BY_SIZE: Record<WeddingPrintSize, number> = {
  '10x15': 15,
  '13x18': 20,
};

export const DEFAULT_WEDDING_PRINT_OPTIONS: WeddingPrintOptions = {
  size: '13x18',
  quantity: 50,
};

export interface WeddingPrintOptions {
  size: WeddingPrintSize;
  quantity: number;
}

export function isWeddingPrintSize(value: unknown): value is WeddingPrintSize {
  return (
    typeof value === 'string' &&
    (WEDDING_PRINT_SIZE_OPTIONS as readonly string[]).includes(value)
  );
}

/** Maps legacy cart metadata (e.g. old A5 option) to current sizes. */
export function normalizeWeddingPrintSize(value: unknown): WeddingPrintSize {
  if (value === 'a5') return '13x18';
  if (isWeddingPrintSize(value)) return value;
  return DEFAULT_WEDDING_PRINT_OPTIONS.size;
}

export function getWeddingPricePerInvitation(size: WeddingPrintSize): number {
  return WEDDING_PRICE_PER_INVITATION_BY_SIZE[size];
}

export function parseWeddingPrintOptions(
  metadata?: CartItem['metadata'],
): WeddingPrintOptions {
  const quantity =
    typeof metadata?.weddingQuantity === 'number' &&
    Number.isFinite(metadata.weddingQuantity)
      ? Math.min(999, Math.max(1, Math.round(metadata.weddingQuantity)))
      : DEFAULT_WEDDING_PRINT_OPTIONS.quantity;

  return {
    size: normalizeWeddingPrintSize(metadata?.weddingSize),
    quantity,
  };
}

export function calculateWeddingPrintPrice(options: WeddingPrintOptions) {
  const pricePerInvitation = getWeddingPricePerInvitation(options.size);
  const printTotal = options.quantity * pricePerInvitation;
  return {
    designFee: WEDDING_DESIGN_FEE,
    printTotal,
    pricePerInvitation,
    total: WEDDING_DESIGN_FEE + printTotal,
  };
}

export function weddingPrintMetadata(
  options: WeddingPrintOptions,
  price: ReturnType<typeof calculateWeddingPrintPrice>,
): Record<string, string | number | boolean> {
  return {
    weddingSize: options.size,
    weddingQuantity: options.quantity,
    weddingDesignFee: price.designFee,
    weddingPrintTotal: price.printTotal,
    weddingPricePerInvitation: price.pricePerInvitation,
  };
}

export function hasWeddingPrintOptions(metadata?: CartItem['metadata']): boolean {
  const size = metadata?.weddingSize;
  return size === 'a5' || isWeddingPrintSize(size);
}

export function isWeddingPrintCartItem(item: CartItem): boolean {
  return (
    item.type === 'design' &&
    item.metadata?.category === 'wedding' &&
    hasWeddingPrintOptions(item.metadata)
  );
}
