import type { CartItem } from '@/lib/cart/types';

export const BUSINESS_CARD_PAPER_OPTIONS = ['240gsm', '300gsm'] as const;
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

export function parseBusinessCardPrintOptions(metadata?: CartItem['metadata']): {
  paper: BusinessCardPaper;
  lamination: BusinessCardLamination;
} {
  return {
    paper: isBusinessCardPaper(metadata?.paper)
      ? metadata.paper
      : DEFAULT_BUSINESS_CARD_PAPER,
    lamination: isBusinessCardLamination(metadata?.lamination)
      ? metadata.lamination
      : DEFAULT_BUSINESS_CARD_LAMINATION,
  };
}

export function businessCardPrintMetadata(options: {
  paper: BusinessCardPaper;
  lamination: BusinessCardLamination;
}): Record<string, string> {
  return {
    paper: options.paper,
    lamination: options.lamination,
  };
}

export function isBusinessCardCartItem(item: CartItem): boolean {
  return (
    item.type === 'design' &&
    (item.metadata?.category === 'business-cards' ||
      item.metadata?.customDesignCategory === 'business-cards')
  );
}
