import type {
  BusinessCardLamination,
  BusinessCardPaper,
} from '@/lib/designs/business-card-print-options';

/** Print8 vizit-pokani v16 — listed package sizes (total MKD). */
export const BUSINESS_CARD_STANDARD_TIERS = [50, 100, 200, 500] as const;
export type BusinessCardStandardTier =
  (typeof BUSINESS_CARD_STANDARD_TIERS)[number];

/** Laminated cards are listed only at these tirages in the price list. */
export const BUSINESS_CARD_LAMINATED_TIERS = [50, 100, 200] as const;
export type BusinessCardLaminatedTier =
  (typeof BUSINESS_CARD_LAMINATED_TIERS)[number];

export const BUSINESS_CARD_MIN_QUANTITY = 50;
export const BUSINESS_CARD_MAX_QUANTITY = 500;

export type BusinessCardSides = 'single' | 'double';

export type BusinessCardLaminationFoil =
  | 'gloss40'
  | 'gloss75'
  | 'matte100'
  | 'gloss125'
  | 'extraRigid250';

export interface BusinessCardPrintJob {
  paper: BusinessCardPaper;
  lamination: BusinessCardLamination;
  quantity: number;
  sides: BusinessCardSides;
}

export interface BusinessCardPrintPriceBreakdown {
  quantity: number;
  sides: BusinessCardSides;
  productLine: 'standard' | 'laminated' | 'premiumWriteOn';
  foil: BusinessCardLaminationFoil | null;
  tirageTotal: number;
  designFee: number;
  total: number;
}

type QuantityPricePoint = { quantity: number; total: number };

const STANDARD_TOTALS: Record<
  BusinessCardStandardTier,
  Record<BusinessCardSides, number>
> = {
  50: { single: 250, double: 320 },
  100: { single: 400, double: 550 },
  200: { single: 600, double: 800 },
  500: { single: 1000, double: 1500 },
};

const LAMINATED_TOTALS: Record<
  BusinessCardLaminationFoil,
  Record<BusinessCardLaminatedTier, Record<BusinessCardSides, number>>
> = {
  gloss40: {
    50: { single: 320, double: 430 },
    100: { single: 540, double: 700 },
    200: { single: 850, double: 1050 },
  },
  gloss75: {
    50: { single: 350, double: 470 },
    100: { single: 580, double: 760 },
    200: { single: 950, double: 1150 },
  },
  matte100: {
    50: { single: 400, double: 530 },
    100: { single: 650, double: 850 },
    200: { single: 1050, double: 1300 },
  },
  gloss125: {
    50: { single: 430, double: 570 },
    100: { single: 700, double: 920 },
    200: { single: 1150, double: 1400 },
  },
  extraRigid250: {
    50: { single: 480, double: 640 },
    100: { single: 800, double: 1050 },
    200: { single: 1300, double: 1600 },
  },
};

const PREMIUM_WRITE_ON_TOTALS: Record<
  BusinessCardStandardTier,
  Record<BusinessCardSides, number>
> = {
  50: { single: 400, double: 520 },
  100: { single: 700, double: 820 },
  200: { single: 1200, double: 1400 },
  500: { single: 2000, double: 2300 },
};

/** 240 gsm is slightly below the 300 g list price. */
const PAPER_240GSM_MULTIPLIER = 0.92;

export function clampBusinessCardQuantity(value: number): number {
  return Math.min(
    BUSINESS_CARD_MAX_QUANTITY,
    Math.max(BUSINESS_CARD_MIN_QUANTITY, Math.round(value)),
  );
}

/**
 * Convert listed package totals into a per-piece rate, then multiply by the
 * actual quantity. Between listed tirages the unit price is interpolated so
 * 150 pcs is cheaper than 200 pcs — we never charge a smaller run the next
 * package total.
 */
function interpolatePackageTotal(
  quantity: number,
  points: readonly QuantityPricePoint[],
): number {
  if (points.length === 0 || quantity <= 0) return 0;

  const first = points[0];
  const last = points[points.length - 1];

  if (quantity <= first.quantity) {
    return Math.round((first.total / first.quantity) * quantity);
  }
  if (quantity >= last.quantity) {
    return Math.round((last.total / last.quantity) * quantity);
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    const low = points[i];
    const high = points[i + 1];
    if (quantity <= high.quantity) {
      const unitLow = low.total / low.quantity;
      const unitHigh = high.total / high.quantity;
      const ratio = (quantity - low.quantity) / (high.quantity - low.quantity);
      const unit = unitLow + (unitHigh - unitLow) * ratio;
      return Math.round(unit * quantity);
    }
  }

  return Math.round((last.total / last.quantity) * quantity);
}

function packagePoints(
  tiers: readonly number[],
  totalAt: (tier: number) => number,
): QuantityPricePoint[] {
  return tiers.map((quantity) => ({ quantity, total: totalAt(quantity) }));
}

export function resolveBusinessCardLaminationFoil(
  lamination: BusinessCardLamination,
): BusinessCardLaminationFoil {
  if (lamination === 'matte') return 'matte100';
  return 'gloss40';
}

export function resolveBusinessCardProductLine(options: {
  paper: BusinessCardPaper;
  lamination: BusinessCardLamination;
}): 'standard' | 'laminated' | 'premiumWriteOn' {
  if (options.paper === 'premiumWriteOn') return 'premiumWriteOn';
  if (options.lamination !== 'none') return 'laminated';
  return 'standard';
}

function applyPaperMultiplier(
  total: number,
  paper: BusinessCardPaper,
): number {
  if (paper === '240gsm') {
    return Math.round(total * PAPER_240GSM_MULTIPLIER);
  }
  return total;
}

export function getBusinessCardTirageTotal(
  options: BusinessCardPrintJob,
): number {
  const quantity = clampBusinessCardQuantity(options.quantity);
  const productLine = resolveBusinessCardProductLine(options);
  const sides = options.sides;

  if (productLine === 'premiumWriteOn') {
    return interpolatePackageTotal(
      quantity,
      packagePoints(BUSINESS_CARD_STANDARD_TIERS, (tier) =>
        PREMIUM_WRITE_ON_TOTALS[tier as BusinessCardStandardTier][sides],
      ),
    );
  }

  if (productLine === 'laminated') {
    const foil = resolveBusinessCardLaminationFoil(options.lamination);
    return interpolatePackageTotal(
      quantity,
      packagePoints(BUSINESS_CARD_LAMINATED_TIERS, (tier) =>
        LAMINATED_TOTALS[foil][tier as BusinessCardLaminatedTier][sides],
      ),
    );
  }

  return applyPaperMultiplier(
    interpolatePackageTotal(
      quantity,
      packagePoints(BUSINESS_CARD_STANDARD_TIERS, (tier) =>
        STANDARD_TOTALS[tier as BusinessCardStandardTier][sides],
      ),
    ),
    options.paper,
  );
}

export function calculateBusinessCardPrintPrice(
  options: BusinessCardPrintJob,
  designFee = 0,
): BusinessCardPrintPriceBreakdown {
  const quantity = clampBusinessCardQuantity(options.quantity);
  const productLine = resolveBusinessCardProductLine(options);
  const foil =
    productLine === 'laminated'
      ? resolveBusinessCardLaminationFoil(options.lamination)
      : null;
  const tirageTotal = getBusinessCardTirageTotal({ ...options, quantity });

  return {
    quantity,
    sides: options.sides,
    productLine,
    foil,
    tirageTotal,
    designFee,
    total: tirageTotal + designFee,
  };
}
