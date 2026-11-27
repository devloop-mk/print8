import {
  HOLIDAY_NOTICE_DISMISS_KEY,
  HOLIDAY_NOTICE_DISMISS_MS,
  isHolidayWorkshopSeason,
  localDayKey,
} from '@/lib/holiday/workshop-config';
import { readTodaysHolidayClaim } from '@/lib/holiday/workshop-storage';
import {
  SPIN_CLAIMED_FLAG_KEY,
  SPIN_PROMO_DISMISS_KEY,
  SPIN_PROMO_DISMISS_MS,
} from '@/lib/rewards/spin-config';
import {
  NY_SCRATCH_DISMISS_KEY,
  NY_SCRATCH_DISMISS_MS,
} from '@/lib/scratch/scratch-config';
import { readNyScratchClaim } from '@/lib/scratch/scratch-storage';

export type DailyPromoId = 'scratch' | 'workshop' | 'wheel';

const PICK_KEY = 'print8_daily_promo';
const PLAYED_KEY = 'print8_daily_promo_played';
const EVENT = 'print8-daily-promo-played';

type StoredPick = {
  day: string;
  id: DailyPromoId;
};

const IDS: readonly DailyPromoId[] = ['scratch', 'workshop', 'wheel'];

function isPromoId(value: unknown): value is DailyPromoId {
  return typeof value === 'string' && (IDS as readonly string[]).includes(value);
}

function readJson(key: string): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function scratchPlayedToday(day: string): boolean {
  const claim = readNyScratchClaim();
  if (!claim) return false;
  return localDayKey(new Date(claim.claimedAt)) === day;
}

function spinClaimedEver(): boolean {
  try {
    return localStorage.getItem(SPIN_CLAIMED_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

/** Games this browser already finished today. */
export function playedPromoIdsToday(now = new Date()): Set<DailyPromoId> {
  const day = localDayKey(now);
  const played = new Set<DailyPromoId>();
  if (scratchPlayedToday(day)) played.add('scratch');
  if (readTodaysHolidayClaim()) played.add('workshop');

  const stored = readJson(PLAYED_KEY);
  if (stored?.day === day && isPromoId(stored.id)) {
    played.add(stored.id);
  }
  return played;
}

function dismissedRecently(key: string, windowMs: number): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < windowMs;
  } catch {
    return false;
  }
}

function isPromoDismissed(id: DailyPromoId): boolean {
  if (id === 'scratch') {
    return dismissedRecently(NY_SCRATCH_DISMISS_KEY, NY_SCRATCH_DISMISS_MS);
  }
  if (id === 'workshop') {
    return dismissedRecently(HOLIDAY_NOTICE_DISMISS_KEY, HOLIDAY_NOTICE_DISMISS_MS);
  }
  return dismissedRecently(SPIN_PROMO_DISMISS_KEY, SPIN_PROMO_DISMISS_MS);
}

function eligiblePromos(now = new Date()): DailyPromoId[] {
  const list: DailyPromoId[] = [];
  if (isHolidayWorkshopSeason(now)) {
    list.push('scratch', 'workshop');
  }
  if (!spinClaimedEver()) list.push('wheel');
  return list.filter((id) => !isPromoDismissed(id));
}

function readPick(day: string): DailyPromoId | null {
  const stored = readJson(PICK_KEY);
  if (!stored || stored.day !== day || !isPromoId(stored.id)) return null;
  return stored.id;
}

function writePick(pick: StoredPick): void {
  try {
    localStorage.setItem(PICK_KEY, JSON.stringify(pick));
  } catch {
    /* ignore quota */
  }
}

/**
 * One automatic promo per browser per calendar day.
 * A finished game blocks the other two for the rest of that day.
 */
export function dailyPromoForAutoShow(now = new Date()): DailyPromoId | null {
  if (typeof window === 'undefined') return null;
  if (playedPromoIdsToday(now).size > 0) return null;

  const day = localDayKey(now);
  const existing = readPick(day);
  if (existing) {
    return isPromoDismissed(existing) ? null : existing;
  }

  const eligible = eligiblePromos(now);
  if (eligible.length === 0) return null;
  const id = eligible[Math.floor(Math.random() * eligible.length)]!;
  writePick({ day, id });
  return id;
}

/** Whether this promo may open on its own right now. */
export function canAutoShowPromo(id: DailyPromoId, now = new Date()): boolean {
  const played = playedPromoIdsToday(now);
  if (played.size > 0) {
    return played.size === 1 && played.has(id) && !isPromoDismissed(id);
  }
  return dailyPromoForAutoShow(now) === id;
}

export function markDailyPromoPlayed(id: DailyPromoId, now = new Date()): void {
  if (typeof window === 'undefined') return;
  const day = localDayKey(now);
  try {
    localStorage.setItem(PLAYED_KEY, JSON.stringify({ day, id }));
  } catch {
    /* ignore quota */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
}

export function onDailyPromoPlayed(
  listener: (id: DailyPromoId) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  function handle(event: Event) {
    const id = (event as CustomEvent<unknown>).detail;
    if (isPromoId(id)) listener(id);
  }
  window.addEventListener(EVENT, handle);
  return () => window.removeEventListener(EVENT, handle);
}
