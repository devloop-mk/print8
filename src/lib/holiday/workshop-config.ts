import { CARGO_DELIVERY_FEE_MKD } from '@/lib/orders/delivery-pricing';

export const HOLIDAY_WORKSHOP_TARGET = 10;
export const HOLIDAY_WORKSHOP_DURATION_MS = 26_000;
export const HOLIDAY_WORKSHOP_VALID_DAYS = 7;
export const HOLIDAY_WORKSHOP_NOTE_PREFIX = 'holiday_workshop';

export const HOLIDAY_CLAIM_STORAGE_KEY = 'print8_holiday_workshop_claim';
export const HOLIDAY_NOTICE_DISMISS_KEY = 'print8_holiday_workshop_notice_dismissed_at';
export const HOLIDAY_NOTICE_DISMISS_MS = 4 * 60 * 60 * 1000;

export type HolidayProductKind =
  | 'mug'
  | 'tshirt'
  | 'calendar'
  | 'cards'
  | 'poster'
  | 'sticker'
  | 'gift';

export type HolidayPrizeKey =
  | 'percent5'
  | 'percent10'
  | 'percent15'
  | 'delivery'
  | 'design'
  | 'mystery'
  | 'golden';

export type HolidayPrizeKind = 'percent' | 'delivery' | 'design' | 'mystery';

export type HolidayPrize = {
  key: HolidayPrizeKey;
  kind: HolidayPrizeKind;
  percent: number | null;
  /** Stored as coupon.discount_amount: MKD cap (percent) or fixed credit. */
  discountAmount: number;
  minOrderAmount: number;
  weight: number;
  golden: boolean;
};

export const HOLIDAY_PRIZES: readonly HolidayPrize[] = [
  {
    key: 'percent5',
    kind: 'percent',
    percent: 5,
    discountAmount: 600,
    minOrderAmount: 0,
    weight: 32,
    golden: false,
  },
  {
    key: 'percent10',
    kind: 'percent',
    percent: 10,
    discountAmount: 1200,
    minOrderAmount: 0,
    weight: 22,
    golden: false,
  },
  {
    key: 'percent15',
    kind: 'percent',
    percent: 15,
    discountAmount: 1800,
    minOrderAmount: 2000,
    weight: 10,
    golden: false,
  },
  {
    key: 'delivery',
    kind: 'delivery',
    percent: null,
    discountAmount: CARGO_DELIVERY_FEE_MKD,
    minOrderAmount: 0,
    weight: 16,
    golden: false,
  },
  {
    key: 'design',
    kind: 'design',
    percent: null,
    discountAmount: 500,
    minOrderAmount: 0,
    weight: 12,
    golden: false,
  },
  {
    key: 'mystery',
    kind: 'mystery',
    percent: null,
    discountAmount: 400,
    minOrderAmount: 1000,
    weight: 5,
    golden: false,
  },
  {
    key: 'golden',
    kind: 'percent',
    percent: 15,
    discountAmount: 2500,
    minOrderAmount: 2000,
    weight: 3,
    golden: true,
  },
] as const;

export const HOLIDAY_PRODUCTS: readonly {
  id: HolidayProductKind;
  href: string;
}[] = [
  { id: 'mug', href: '/products/type/mug' },
  { id: 'tshirt', href: '/products/type/t-shirt' },
  { id: 'calendar', href: '/catalog' },
  { id: 'cards', href: '/services/business-cards' },
  { id: 'poster', href: '/services/a3-posters' },
  { id: 'sticker', href: '/products/type/magnet' },
  { id: 'gift', href: '/products/type/gift-box' },
];

export function encodeHolidayWorkshopNote(
  prize: HolidayPrize,
  boostKind?: HolidayProductKind | null,
): string {
  const boost =
    boostKind && isHolidayProductKind(boostKind) ? `|${boostKind}` : '';
  if (prize.kind === 'percent' && prize.percent) {
    return `${HOLIDAY_WORKSHOP_NOTE_PREFIX}|percent|${prize.percent}|${prize.key}${boost}`;
  }
  return `${HOLIDAY_WORKSHOP_NOTE_PREFIX}|${prize.kind}|${prize.key}${boost}`;
}

export function parseHolidayWorkshopNote(note: string | null | undefined): {
  kind: HolidayPrizeKind;
  percent: number | null;
  prizeKey: HolidayPrizeKey | null;
  boostKind: HolidayProductKind | null;
} | null {
  if (!note?.startsWith(`${HOLIDAY_WORKSHOP_NOTE_PREFIX}|`)) return null;
  const parts = note.split('|');
  const kindRaw = parts[1];
  const last = parts[parts.length - 1];
  const boostKind = last && isHolidayProductKind(last) ? last : null;
  const prizeKeyRaw = kindRaw === 'percent' ? parts[3] : parts[2];
  const prizeKey =
    prizeKeyRaw && isHolidayPrizeKey(prizeKeyRaw) ? prizeKeyRaw : null;

  if (kindRaw === 'percent') {
    const percent = Number(parts[2]);
    if (percent !== 5 && percent !== 10 && percent !== 15) return null;
    return {
      kind: 'percent',
      percent,
      prizeKey,
      boostKind,
    };
  }

  if (kindRaw === 'delivery' || kindRaw === 'design' || kindRaw === 'mystery') {
    return {
      kind: kindRaw,
      percent: null,
      prizeKey,
      boostKind,
    };
  }

  return null;
}

export function isHolidayProductKind(value: string): value is HolidayProductKind {
  return HOLIDAY_PRODUCTS.some((product) => product.id === value);
}

export function isHolidayPrizeKey(value: string): value is HolidayPrizeKey {
  return HOLIDAY_PRIZES.some((prize) => prize.key === value);
}

export function getHolidayPrize(key: HolidayPrizeKey): HolidayPrize {
  return HOLIDAY_PRIZES.find((prize) => prize.key === key) ?? HOLIDAY_PRIZES[0];
}

export function isHolidayWorkshopSeason(now = new Date()): boolean {
  const month = now.getMonth();
  const day = now.getDate();
  if (month === 10 && day >= 15) return true;
  if (month === 11) return true;
  if (month === 0 && day <= 15) return true;
  return false;
}

export function localDayKey(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function pickHolidaySuggestion(
  collectedKinds: HolidayProductKind[] = [],
): (typeof HOLIDAY_PRODUCTS)[number] {
  if (collectedKinds.length > 0) {
    const counts = new Map<HolidayProductKind, number>();
    for (const kind of collectedKinds) {
      counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
    let best = collectedKinds[collectedKinds.length - 1];
    let bestCount = 0;
    for (const kind of collectedKinds) {
      const count = counts.get(kind) ?? 0;
      if (count >= bestCount) {
        best = kind;
        bestCount = count;
      }
    }
    const match = HOLIDAY_PRODUCTS.find((item) => item.id === best);
    if (match) return match;
  }
  const index = Math.floor(Math.random() * HOLIDAY_PRODUCTS.length);
  return HOLIDAY_PRODUCTS[index] ?? HOLIDAY_PRODUCTS[0];
}
