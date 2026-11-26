import {
  HOLIDAY_CLAIM_STORAGE_KEY,
  HOLIDAY_NOTICE_DISMISS_KEY,
  HOLIDAY_NOTICE_DISMISS_MS,
  isHolidayPrizeKey,
  localDayKey,
  type HolidayPrizeKey,
  type HolidayProductKind,
} from '@/lib/holiday/workshop-config';

export type StoredHolidayClaim = {
  day: string;
  prizeKey: HolidayPrizeKey;
  couponCode: string;
  minOrderAmount: number;
  discountAmount: number;
  percent: number | null;
  validDays: number;
  golden: boolean;
  suggestionId: HolidayProductKind;
  suggestionHref: string;
  claimedAt: number;
};

function isStoredClaim(value: unknown): value is StoredHolidayClaim {
  if (!value || typeof value !== 'object') return false;
  const row = value as StoredHolidayClaim;
  return (
    typeof row.day === 'string' &&
    isHolidayPrizeKey(row.prizeKey) &&
    typeof row.couponCode === 'string' &&
    row.couponCode.length >= 6 &&
    typeof row.minOrderAmount === 'number' &&
    typeof row.discountAmount === 'number' &&
    typeof row.validDays === 'number' &&
    typeof row.golden === 'boolean' &&
    typeof row.suggestionId === 'string' &&
    typeof row.suggestionHref === 'string' &&
    typeof row.claimedAt === 'number'
  );
}

export function readHolidayClaim(): StoredHolidayClaim | null {
  try {
    const raw = localStorage.getItem(HOLIDAY_CLAIM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isStoredClaim(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readTodaysHolidayClaim(): StoredHolidayClaim | null {
  const claim = readHolidayClaim();
  if (!claim) return null;
  if (claim.day !== localDayKey()) return null;
  return claim;
}

export function saveHolidayClaim(claim: StoredHolidayClaim): void {
  try {
    localStorage.setItem(HOLIDAY_CLAIM_STORAGE_KEY, JSON.stringify(claim));
  } catch {
    /* ignore quota */
  }
}

export function wasHolidayNoticeDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(HOLIDAY_NOTICE_DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < HOLIDAY_NOTICE_DISMISS_MS;
  } catch {
    return false;
  }
}

export function dismissHolidayNotice(): void {
  try {
    localStorage.setItem(HOLIDAY_NOTICE_DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
