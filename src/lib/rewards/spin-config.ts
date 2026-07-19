export type SpinPrizeKey =
  | 'try_again'
  | 'd100'
  | 'd200'
  | 'd300'
  | 'd400'
  | 'd500';

export type SpinSegment = {
  key: SpinPrizeKey;
  discountAmount: number;
  minOrderAmount: number;
  weight: number;
  /** Wheel fill color */
  color: string;
  /** Label shown on the wheel (MK short) */
  labelMk: string;
  labelEn: string;
};

/**
 * Visual + server order — index is authoritative for animation landing.
 * `try_again` is shown on the wheel (weight 0) but never picked for landing.
 * Only segments with weight > 0 and discountAmount > 0 are winnable.
 */
export const SPIN_SEGMENTS: readonly SpinSegment[] = [
  {
    key: 'd100',
    discountAmount: 100,
    minOrderAmount: 800,
    weight: 28,
    color: '#2a7eb8',
    labelMk: '−100 ден.',
    labelEn: '−100 MKD',
  },
  {
    key: 'd500',
    discountAmount: 500,
    minOrderAmount: 2500,
    weight: 10,
    color: '#f59f0a',
    labelMk: '−500 ден.',
    labelEn: '−500 MKD',
  },
  {
    key: 'd200',
    discountAmount: 200,
    minOrderAmount: 1200,
    weight: 20,
    color: '#e85d04',
    labelMk: '−200 ден.',
    labelEn: '−200 MKD',
  },
  {
    key: 'try_again',
    discountAmount: 0,
    minOrderAmount: 0,
    weight: 0,
    color: '#5c6b7a',
    labelMk: 'Обиди се повторно',
    labelEn: 'Try again',
  },
  {
    key: 'd300',
    discountAmount: 300,
    minOrderAmount: 1800,
    weight: 14,
    color: '#1a4d6e',
    labelMk: '−300 ден.',
    labelEn: '−300 MKD',
  },
  {
    key: 'd400',
    discountAmount: 400,
    minOrderAmount: 2200,
    weight: 12,
    color: '#c2410c',
    labelMk: '−400 ден.',
    labelEn: '−400 MKD',
  },
] as const;

export const SPIN_COUPON_VALID_DAYS = 30;
export const SPIN_PROMO_DISMISS_KEY = 'print8_spin_promo_dismissed_at';
export const SPIN_PROMO_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
export const SPIN_CLAIMED_FLAG_KEY = 'print8_spin_claimed';
/** Pending coupon from spin “use now” → checkout auto-apply */
export const SPIN_PENDING_COUPON_KEY = 'print8_pending_coupon';

export function getSpinSegmentIndex(key: SpinPrizeKey): number {
  const index = SPIN_SEGMENTS.findIndex((segment) => segment.key === key);
  return index >= 0 ? index : 0;
}

/** Degrees per pie slice (equal segments, clockwise from top). */
export function getSpinSliceDegrees(): number {
  return 360 / SPIN_SEGMENTS.length;
}

/**
 * CSS `rotate()` degrees so segment `segmentIndex` center lands under the
 * top pointer. Positive CSS rotation is clockwise; we therefore rotate by
 * the negative of the segment's center angle (measured clockwise from top).
 */
export function getSpinLandingRotation(
  segmentIndex: number,
  fullTurns = 6,
): number {
  const n = SPIN_SEGMENTS.length;
  const slice = 360 / n;
  const index = ((segmentIndex % n) + n) % n;
  const centerFromTop = index * slice + slice / 2;
  return fullTurns * 360 - centerFromTop;
}
