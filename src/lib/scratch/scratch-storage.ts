import {
  NY_SCRATCH_COOLDOWN_MS,
  NY_SCRATCH_DISMISS_KEY,
  NY_SCRATCH_DISMISS_MS,
  NY_SCRATCH_STORAGE_KEY,
  isNyScratchPrizeKey,
  isValidNyScratchGrid,
  type NyScratchPrizeKey,
} from '@/lib/scratch/scratch-config';

export type StoredNyScratchClaim = {
  claimedAt: number;
  couponCode: string;
  prizeKey: NyScratchPrizeKey;
  percent: number | null;
  discountAmount: number;
  minOrderAmount: number;
  jackpot: boolean;
  href: string;
  endsAt: string | null;
  grid?: NyScratchPrizeKey[];
  playComplete?: boolean;
};

function parseStoredClaim(value: unknown): StoredNyScratchClaim | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row.claimedAt !== 'number' ||
    !Number.isFinite(row.claimedAt) ||
    typeof row.couponCode !== 'string' ||
    row.couponCode.length < 8 ||
    typeof row.prizeKey !== 'string' ||
    !isNyScratchPrizeKey(row.prizeKey)
  ) {
    return null;
  }

  const grid = isValidNyScratchGrid(row.grid, row.prizeKey) ? row.grid : undefined;
  const playComplete =
    typeof row.playComplete === 'boolean' ? row.playComplete : undefined;

  return {
    claimedAt: row.claimedAt,
    couponCode: row.couponCode,
    prizeKey: row.prizeKey,
    percent: typeof row.percent === 'number' ? row.percent : null,
    discountAmount: Number(row.discountAmount ?? 0),
    minOrderAmount: Number(row.minOrderAmount ?? 0),
    jackpot: Boolean(row.jackpot),
    href: typeof row.href === 'string' ? row.href : '/checkout',
    endsAt: typeof row.endsAt === 'string' ? row.endsAt : null,
    grid,
    playComplete,
  };
}

/** Legacy claims (no grid) and finished games skip the scratch board. */
export function isNyScratchPlayComplete(claim: StoredNyScratchClaim): boolean {
  if (claim.playComplete === true) return true;
  if (claim.grid && claim.grid.length === 9 && claim.playComplete === false) {
    return false;
  }
  return !claim.grid;
}

export function readNyScratchClaim(): StoredNyScratchClaim | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(NY_SCRATCH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseStoredClaim(JSON.parse(raw));
    if (!parsed) return null;
    if (Date.now() - parsed.claimedAt >= NY_SCRATCH_COOLDOWN_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveNyScratchClaim(claim: StoredNyScratchClaim): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NY_SCRATCH_STORAGE_KEY, JSON.stringify(claim));
  } catch {
    /* private mode / quota */
  }
}

export function wasNyScratchDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(NY_SCRATCH_DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < NY_SCRATCH_DISMISS_MS;
  } catch {
    return false;
  }
}

export function dismissNyScratch(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NY_SCRATCH_DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}
