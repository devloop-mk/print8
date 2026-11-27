import {
  countCouponRedemptions,
  countCouponRedemptionsToday,
  getCouponByCode,
  normalizeCouponCode,
  type CouponRecord,
} from '@/lib/db/coupons';
import {
  buildHolidayCouponApplication,
  compactHolidayDiscountLine,
  computeHolidayPercentDiscount,
  computeProductGiveawayDiscount,
  holidayMatchingSubtotal,
  type HolidayCouponApplication,
  type HolidayDiscountLine,
} from '@/lib/holiday/holiday-discount';
import { parseHolidayWorkshopNote } from '@/lib/holiday/workshop-config';
import {
  parseNyScratchNote,
  type ScratchCouponApplication,
} from '@/lib/scratch/scratch-config';

export type CouponValidationErrorCode =
  | 'missing_code'
  | 'not_found'
  | 'inactive'
  | 'not_started'
  | 'expired'
  | 'min_order'
  | 'daily_limit'
  | 'total_limit'
  | 'email_mismatch';

export type CouponValidationResult =
  | {
      ok: true;
      coupon: CouponRecord;
      discountAmount: number;
      subtotalAmount: number;
      totalAmount: number;
      holiday: HolidayCouponApplication | null;
      scratch: ScratchCouponApplication | null;
      capped: boolean;
    }
  | {
      ok: false;
      code: CouponValidationErrorCode;
      message: string;
      minOrderAmount?: number;
    };

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/**
 * Server-side coupon validation. Always pass the authoritative subtotal
 * from validateOrderPrices — never trust a client-sent discount.
 */
export async function validateCouponForCheckout(input: {
  code: string | null | undefined;
  subtotalAmount: number;
  customerEmail?: string | null;
  items?: readonly HolidayDiscountLine[];
}): Promise<CouponValidationResult> {
  const raw = input.code?.trim() ?? '';
  if (!raw) {
    return {
      ok: false,
      code: 'missing_code',
      message: 'Coupon code is required',
    };
  }

  const coupon = await getCouponByCode(normalizeCouponCode(raw));
  if (!coupon) {
    return { ok: false, code: 'not_found', message: 'Coupon not found' };
  }

  if (!coupon.active) {
    return { ok: false, code: 'inactive', message: 'Coupon is inactive' };
  }

  const now = Date.now();
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) {
    return { ok: false, code: 'not_started', message: 'Coupon is not active yet' };
  }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) {
    return { ok: false, code: 'expired', message: 'Coupon has expired' };
  }

  if (input.subtotalAmount + 1e-9 < coupon.minOrderAmount) {
    return {
      ok: false,
      code: 'min_order',
      message: 'Order total is below the coupon minimum',
      minOrderAmount: coupon.minOrderAmount,
    };
  }

  if (coupon.kind === 'reward_issued' && coupon.issuedToEmail) {
    const email = (input.customerEmail ?? '').trim().toLowerCase();
    if (!email || email !== coupon.issuedToEmail.trim().toLowerCase()) {
      return {
        ok: false,
        code: 'email_mismatch',
        message: 'This reward coupon is tied to a different email',
      };
    }
  }

  if (coupon.maxRedemptionsTotal != null) {
    const totalUsed = await countCouponRedemptions(coupon.id);
    if (totalUsed >= coupon.maxRedemptionsTotal) {
      return {
        ok: false,
        code: 'total_limit',
        message: 'Coupon redemption limit reached',
      };
    }
  }

  if (coupon.maxRedemptionsPerDay != null) {
    const usedToday = await countCouponRedemptionsToday(coupon.id);
    if (usedToday >= coupon.maxRedemptionsPerDay) {
      return {
        ok: false,
        code: 'daily_limit',
        message: 'Daily coupon limit reached',
      };
    }
  }

  const items = (input.items ?? []).map(compactHolidayDiscountLine);
  const holidayNote = parseHolidayWorkshopNote(coupon.note);
  const scratchNote = parseNyScratchNote(coupon.note);
  const holiday = holidayNote
    ? buildHolidayCouponApplication({
        prizeKind: holidayNote.kind,
        percent: holidayNote.percent,
        boostKind: holidayNote.boostKind,
        items,
        subtotalAmount: input.subtotalAmount,
      })
    : scratchNote?.kind === 'percent'
      ? buildHolidayCouponApplication({
          prizeKind: 'percent',
          percent: scratchNote.percent,
          boostKind: null,
          items,
          subtotalAmount: input.subtotalAmount,
        })
      : null;
  const scratch: ScratchCouponApplication | null = scratchNote
    ? {
        prizeKey: scratchNote.prizeKey,
        prizeKind: scratchNote.kind,
        percent: scratchNote.percent,
        productKind: scratchNote.productKind,
        matchingSubtotal: scratchNote.productKind
          ? holidayMatchingSubtotal(items, scratchNote.productKind)
          : 0,
      }
    : null;

  let rawDiscount = coupon.discountAmount;
  if (holiday?.prizeKind === 'percent' && holiday.percent) {
    rawDiscount = computeHolidayPercentDiscount({
      percent: holiday.percent,
      boostKind: holiday.boostKind,
      items,
      subtotalAmount: input.subtotalAmount,
      cap: coupon.discountAmount,
    });
  } else if (scratchNote?.kind === 'product' && scratchNote.productKind) {
    rawDiscount = computeProductGiveawayDiscount({
      kind: scratchNote.productKind,
      items,
      subtotalAmount: input.subtotalAmount,
      cap: coupon.discountAmount,
    });
  }

  const discountAmount = roundMoney(
    Math.min(rawDiscount, coupon.discountAmount, Math.max(0, input.subtotalAmount)),
  );
  const totalAmount = roundMoney(Math.max(0, input.subtotalAmount - discountAmount));

  return {
    ok: true,
    coupon,
    discountAmount,
    subtotalAmount: roundMoney(input.subtotalAmount),
    totalAmount,
    holiday,
    scratch,
    capped:
      Boolean(holiday?.percent) &&
      coupon.discountAmount > 0 &&
      discountAmount + 1e-9 >= coupon.discountAmount,
  };
}
