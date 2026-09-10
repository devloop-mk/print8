import type { CartItem } from '@/lib/cart/types';
import {
  BUSINESS_CARD_MAX_QUANTITY,
  BUSINESS_CARD_MIN_QUANTITY,
  calculateBusinessCardPrintPrice,
  clampBusinessCardQuantity,
  type BusinessCardPrintJob,
  type BusinessCardPrintPriceBreakdown,
  type BusinessCardSides,
} from '@/lib/designs/business-card-print-pricing';

export {
  BUSINESS_CARD_MAX_QUANTITY,
  BUSINESS_CARD_MIN_QUANTITY,
  BUSINESS_CARD_STANDARD_TIERS,
  calculateBusinessCardPrintPrice,
  clampBusinessCardQuantity,
  type BusinessCardPrintPriceBreakdown,
  type BusinessCardSides,
} from '@/lib/designs/business-card-print-pricing';

export const BUSINESS_CARD_PAPER_OPTIONS = [
  '240gsm',
  '300gsm',
  'premiumWriteOn',
] as const;
export type BusinessCardPaper = (typeof BUSINESS_CARD_PAPER_OPTIONS)[number];

export const BUSINESS_CARD_LAMINATION_OPTIONS = [
  'none',
  'matte',
  'glossy',
] as const;
export type BusinessCardLamination =
  (typeof BUSINESS_CARD_LAMINATION_OPTIONS)[number];

export const DEFAULT_BUSINESS_CARD_PAPER: BusinessCardPaper = '300gsm';
export const DEFAULT_BUSINESS_CARD_LAMINATION: BusinessCardLamination = 'none';
export const DEFAULT_BUSINESS_CARD_QUANTITY = 50;
export const DEFAULT_BUSINESS_CARD_SIDES: BusinessCardSides = 'single';

export interface BusinessCardPrintOptions extends BusinessCardPrintJob {}

export const DEFAULT_BUSINESS_CARD_PRINT_OPTIONS: BusinessCardPrintOptions = {
  paper: DEFAULT_BUSINESS_CARD_PAPER,
  lamination: DEFAULT_BUSINESS_CARD_LAMINATION,
  quantity: DEFAULT_BUSINESS_CARD_QUANTITY,
  sides: DEFAULT_BUSINESS_CARD_SIDES,
};

export function isBusinessCardPaper(value: unknown): value is BusinessCardPaper {
  return (
    typeof value === 'string' &&
    (BUSINESS_CARD_PAPER_OPTIONS as readonly string[]).includes(value)
  );
}

export function isBusinessCardLamination(
  value: unknown,
): value is BusinessCardLamination {
  return (
    typeof value === 'string' &&
    (BUSINESS_CARD_LAMINATION_OPTIONS as readonly string[]).includes(value)
  );
}

export function isBusinessCardSides(value: unknown): value is BusinessCardSides {
  return value === 'single' || value === 'double';
}

export function supportsBusinessCardLamination(paper: BusinessCardPaper): boolean {
  return paper !== 'premiumWriteOn';
}

export function resolveBusinessCardLamination(options: {
  paper: BusinessCardPaper;
  lamination: BusinessCardLamination;
}): BusinessCardLamination {
  return supportsBusinessCardLamination(options.paper)
    ? options.lamination
    : 'none';
}

export function parseBusinessCardPrintOptions(
  metadata?: CartItem['metadata'],
): BusinessCardPrintOptions {
  const paper = isBusinessCardPaper(metadata?.paper)
    ? metadata.paper
    : DEFAULT_BUSINESS_CARD_PAPER;
  const lamination = isBusinessCardLamination(metadata?.lamination)
    ? metadata.lamination
    : DEFAULT_BUSINESS_CARD_LAMINATION;

  const quantity =
    typeof metadata?.bcardQuantity === 'number' &&
    Number.isFinite(metadata.bcardQuantity)
      ? clampBusinessCardQuantity(metadata.bcardQuantity)
      : DEFAULT_BUSINESS_CARD_QUANTITY;

  const sides = isBusinessCardSides(metadata?.bcardSides)
    ? metadata.bcardSides
    : DEFAULT_BUSINESS_CARD_SIDES;

  return {
    paper,
    lamination: resolveBusinessCardLamination({ paper, lamination }),
    quantity,
    sides,
  };
}

export function businessCardPrintMetadata(
  options: BusinessCardPrintOptions,
  breakdown?: BusinessCardPrintPriceBreakdown,
): Record<string, string | number> {
  const lamination = resolveBusinessCardLamination(options);
  const price = breakdown ?? calculateBusinessCardPrintPrice(options);

  return {
    paper: options.paper,
    lamination,
    bcardQuantity: price.quantity,
    bcardSides: price.sides,
    bcardPrintTotal: price.tirageTotal,
    bcardDesignFee: price.designFee,
  };
}

export function hasBusinessCardPrintOptions(
  metadata?: CartItem['metadata'],
): boolean {
  return (
    typeof metadata?.bcardQuantity === 'number' &&
    Number.isFinite(metadata.bcardQuantity)
  );
}

export function isBusinessCardCartItem(item: CartItem): boolean {
  return (
    item.type === 'design' &&
    (item.metadata?.category === 'business-cards' ||
      item.metadata?.customDesignCategory === 'business-cards')
  );
}
