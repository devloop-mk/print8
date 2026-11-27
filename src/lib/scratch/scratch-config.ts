import { CARGO_DELIVERY_FEE_MKD } from '@/lib/orders/delivery-pricing';
import { isHolidayWorkshopSeason } from '@/lib/holiday/workshop-config';
import type { HolidayProductKind } from '@/lib/holiday/workshop-config';

export const NY_SCRATCH_NOTE_PREFIX = 'ny_scratch';
export const NY_SCRATCH_STORAGE_KEY = 'print8_ny_scratch_claim';
export const NY_SCRATCH_DISMISS_KEY = 'print8_ny_scratch_dismissed_at';
/** Don’t auto-open again for 4 hours after close without a new claim. */
export const NY_SCRATCH_DISMISS_MS = 4 * 60 * 60 * 1000;
/** One scratch per browser every 24 hours. */
export const NY_SCRATCH_COOLDOWN_MS = 24 * 60 * 60 * 1000;
export const NY_SCRATCH_VALID_DAYS = 21;
/** Auto-clear the foil once this share of pixels is gone. */
export const NY_SCRATCH_REVEAL_RATIO = 0.5;
export const NY_SCRATCH_CELL_COUNT = 9;
export const NY_SCRATCH_WIN_COUNT = 3;

export type NyScratchPrizeKey =
  | 'percent5'
  | 'percent10'
  | 'percent15'
  | 'shipping'
  | 'mug'
  | 'tshirt';

export type NyScratchPrizeKind = 'percent' | 'delivery' | 'product';

export type NyScratchPrize = {
  key: NyScratchPrizeKey;
  kind: NyScratchPrizeKind;
  percent: number | null;
  productKind: Extract<HolidayProductKind, 'mug' | 'tshirt'> | null;
  /** MKD cap stored on the coupon. */
  discountAmount: number;
  minOrderAmount: number;
  /** Relative weight; totals 1000 = 100%. */
  weight: number;
  jackpot: boolean;
  href: string;
};

/**
 * Odds (weight / 1000):
 * 5% → 50%, 10% → 25%, 15% → 15%,
 * shipping → 7%, mug → 2.5%, t-shirt → 0.5%.
 */
export const NY_SCRATCH_PRIZES: readonly NyScratchPrize[] = [
  {
    key: 'percent5',
    kind: 'percent',
    percent: 5,
    productKind: null,
    discountAmount: 800,
    minOrderAmount: 0,
    weight: 500,
    jackpot: false,
    href: '/checkout',
  },
  {
    key: 'percent10',
    kind: 'percent',
    percent: 10,
    productKind: null,
    discountAmount: 1500,
    minOrderAmount: 0,
    weight: 250,
    jackpot: false,
    href: '/checkout',
  },
  {
    key: 'percent15',
    kind: 'percent',
    percent: 15,
    productKind: null,
    discountAmount: 2500,
    minOrderAmount: 1500,
    weight: 150,
    jackpot: false,
    href: '/checkout',
  },
  {
    key: 'shipping',
    kind: 'delivery',
    percent: null,
    productKind: null,
    discountAmount: CARGO_DELIVERY_FEE_MKD,
    minOrderAmount: 0,
    weight: 70,
    jackpot: false,
    href: '/checkout',
  },
  {
    key: 'mug',
    kind: 'product',
    percent: null,
    productKind: 'mug',
    discountAmount: 900,
    minOrderAmount: 0,
    weight: 25,
    jackpot: false,
    href: '/products/type/mug',
  },
  {
    key: 'tshirt',
    kind: 'product',
    percent: null,
    productKind: 'tshirt',
    discountAmount: 2500,
    minOrderAmount: 0,
    weight: 5,
    jackpot: true,
    href: '/products/type/t-shirt',
  },
];

export function isNyScratchSeason(now = new Date()): boolean {
  return isHolidayWorkshopSeason(now);
}

/** Coupon year: Nov–Dec campaign prints the upcoming New Year. */
export function nyScratchCouponYear(now = new Date()): number {
  return now.getMonth() >= 10 ? now.getFullYear() + 1 : now.getFullYear();
}

export function isNyScratchPrizeKey(value: string): value is NyScratchPrizeKey {
  return NY_SCRATCH_PRIZES.some((prize) => prize.key === value);
}

export function getNyScratchPrize(key: NyScratchPrizeKey): NyScratchPrize {
  return NY_SCRATCH_PRIZES.find((prize) => prize.key === key) ?? NY_SCRATCH_PRIZES[0];
}

export function isValidNyScratchGrid(
  grid: unknown,
  prizeKey: NyScratchPrizeKey,
): grid is NyScratchPrizeKey[] {
  if (!Array.isArray(grid) || grid.length !== NY_SCRATCH_CELL_COUNT) return false;
  if (!grid.every((cell): cell is NyScratchPrizeKey => typeof cell === 'string' && isNyScratchPrizeKey(cell))) {
    return false;
  }

  const counts = new Map<NyScratchPrizeKey, number>();
  for (const key of grid) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if ((counts.get(prizeKey) ?? 0) !== NY_SCRATCH_WIN_COUNT) return false;
  for (const [key, count] of counts) {
    if (key === prizeKey) continue;
    if (count > 2) return false;
  }
  return true;
}

export function winningGridIndices(
  grid: readonly NyScratchPrizeKey[],
  prizeKey: NyScratchPrizeKey,
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < grid.length; i += 1) {
    if (grid[i] === prizeKey) indices.push(i);
  }
  return indices;
}

export function hasRevealedWinningTriple(
  grid: readonly NyScratchPrizeKey[],
  revealed: readonly boolean[],
  prizeKey: NyScratchPrizeKey,
): boolean {
  let matched = 0;
  const limit = Math.min(grid.length, revealed.length);
  for (let i = 0; i < limit; i += 1) {
    if (revealed[i] && grid[i] === prizeKey) matched += 1;
  }
  return matched >= NY_SCRATCH_WIN_COUNT;
}

export function encodeNyScratchNote(prize: NyScratchPrize): string {
  if (prize.kind === 'percent' && prize.percent) {
    return `${NY_SCRATCH_NOTE_PREFIX}|percent|${prize.percent}|${prize.key}`;
  }
  if (prize.kind === 'product' && prize.productKind) {
    return `${NY_SCRATCH_NOTE_PREFIX}|product|${prize.productKind}|${prize.key}`;
  }
  return `${NY_SCRATCH_NOTE_PREFIX}|delivery|${prize.key}`;
}

export type ScratchCouponApplication = {
  prizeKey: NyScratchPrizeKey | null;
  prizeKind: NyScratchPrizeKind;
  percent: number | null;
  productKind: NyScratchPrize['productKind'];
  matchingSubtotal: number;
};

export function parseNyScratchNote(note: string | null | undefined): {
  kind: NyScratchPrizeKind;
  percent: number | null;
  prizeKey: NyScratchPrizeKey | null;
  productKind: NyScratchPrize['productKind'];
} | null {
  if (!note?.startsWith(`${NY_SCRATCH_NOTE_PREFIX}|`)) return null;
  const parts = note.split('|');
  const kindRaw = parts[1];

  if (kindRaw === 'percent') {
    const percent = Number(parts[2]);
    const prizeKey = parts[3];
    if (percent !== 5 && percent !== 10 && percent !== 15) return null;
    return {
      kind: 'percent',
      percent,
      prizeKey: isNyScratchPrizeKey(prizeKey) ? prizeKey : null,
      productKind: null,
    };
  }

  if (kindRaw === 'product') {
    const productKind = parts[2] === 'mug' || parts[2] === 'tshirt' ? parts[2] : null;
    const prizeKey = parts[3];
    return {
      kind: 'product',
      percent: null,
      prizeKey: isNyScratchPrizeKey(prizeKey) ? prizeKey : null,
      productKind,
    };
  }

  if (kindRaw === 'delivery') {
    const prizeKey = parts[2];
    return {
      kind: 'delivery',
      percent: null,
      prizeKey: isNyScratchPrizeKey(prizeKey) ? prizeKey : null,
      productKind: null,
    };
  }

  return null;
}
