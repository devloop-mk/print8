import { after, NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { checkoutSchema, normalizeCheckoutFulfillment } from '@/lib/validations/order';
import { generateOrderNumber } from '@/lib/utils';
import { sendOrderEmails } from '@/lib/email/order-emails';
import {
  validateOrderAssetLimits,
  validateOrderInlineAssetSize,
} from '@/lib/orders/order-assets';
import { validateOrderPrices } from '@/lib/orders/validate-order-prices';
import { validateOrderUploadFiles } from '@/lib/orders/validate-order-uploads';
import {
  reserveExclusiveDesignsForOrder,
  syncExclusiveDesignsForOrderStatus,
  validateExclusiveDesignsAvailable,
} from '@/lib/designs/design-reservations';
import { revalidateDesignCatalogCache } from '@/lib/catalog/revalidate-design-catalog';
import { enforceRateLimit } from '@/lib/security/rate-limit';
import { subscribeToNewsletter } from '@/lib/db/newsletter';
import { persistOrderPrintSvgs } from '@/lib/orders/persist-order-print-svgs';
import { persistOrderPrintPngs } from '@/lib/orders/persist-order-print-pngs';
import { validateCouponForCheckout } from '@/lib/coupons/validate-coupon';
import {
  issueRewardCoupon,
  listRewardTiers,
  pickBestRewardTier,
  recordCouponRedemption,
} from '@/lib/db/coupons';
import { createSupabaseRequestClient } from '@/lib/supabase/server-auth';
import { customersDb } from '@/lib/db/customers';
import { validatePointsRedemptionForCheckout } from '@/lib/loyalty/validate-redemption';
import { redeemPointsForOrder, reservePendingPointsForOrder } from '@/lib/loyalty/order-loyalty';
import { requireTurnstileOrReject } from '@/lib/security/turnstile';

const MAX_ORDER_BODY_BYTES = 6_000_000;

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'orders', 15, 60 * 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    const rawBody = await request.text();
    if (rawBody.length > MAX_ORDER_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Request too large', code: 'payload_too_large' },
        { status: 413 },
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid order data',
          code: 'invalid_order_data',
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = normalizeCheckoutFulfillment(parsed.data);

    const turnstile = await requireTurnstileOrReject(
      parsed.data.turnstileToken,
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    );
    if (!turnstile.ok) {
      return NextResponse.json(
        { error: turnstile.message, code: 'turnstile_failed' },
        { status: turnstile.status },
      );
    }

    const uploadValidation = await validateOrderUploadFiles(data);
    if (!uploadValidation.ok) {
      return NextResponse.json(
        {
          error: 'Invalid file references for this order',
          code: uploadValidation.code,
        },
        { status: 400 },
      );
    }

    const assetLimits = validateOrderAssetLimits(data);
    if (!assetLimits.ok) {
      return NextResponse.json(
        {
          error:
            assetLimits.error === 'too_many_stickers'
              ? 'Order sticker limit exceeded'
              : 'Order photo limit exceeded',
          code: assetLimits.error,
        },
        { status: 400 },
      );
    }

    const inlineAssets = validateOrderInlineAssetSize(data);
    if (!inlineAssets.ok) {
      return NextResponse.json(
        {
          error: 'Order inline assets too large',
          code: inlineAssets.error,
        },
        { status: 413 },
      );
    }

    const priceValidation = await validateOrderPrices(data);
    if (!priceValidation.ok) {
      return NextResponse.json(
        {
          error: 'Order pricing could not be verified',
          code: priceValidation.code,
        },
        { status: 400 },
      );
    }

    const availability = await validateExclusiveDesignsAvailable(data.items);
    if (!availability.ok) {
      return NextResponse.json(
        {
          error: 'One or more exclusive designs are no longer available',
          code: 'design_unavailable',
          unavailable: availability.unavailable,
        },
        { status: 409 },
      );
    }

    const subtotalAmount = priceValidation.totalAmount;
    let discountAmount = 0;
    let totalAmount = subtotalAmount;
    let appliedCouponCode: string | null = null;
    let appliedCouponId: string | null = null;
    let pointsCharged = 0;
    let pointsDiscountAmount = 0;
    let customerId: string | null = null;

    const supabase = createSupabaseRequestClient(request);
    const { data: authData } = await supabase.auth.getUser();
    let customer = null;
    if (authData.user?.id && authData.user.email) {
      customer = await customersDb.ensureProfile({
        id: authData.user.id,
        email: authData.user.email,
      });
      customerId = customer.id;
    }

    if (data.couponCode) {
      const couponResult = await validateCouponForCheckout({
        code: data.couponCode,
        subtotalAmount,
        customerEmail: data.email,
      });
      if (!couponResult.ok) {
        return NextResponse.json(
          {
            error: couponResult.message,
            code: `coupon_${couponResult.code}`,
            minOrderAmount: couponResult.minOrderAmount,
          },
          { status: 400 },
        );
      }
      discountAmount = couponResult.discountAmount;
      totalAmount = couponResult.totalAmount;
      appliedCouponCode = couponResult.coupon.code;
      appliedCouponId = couponResult.coupon.id;
    }

    const subtotalAfterCoupon = Math.max(0, subtotalAmount - discountAmount);
    const pointsValidation = validatePointsRedemptionForCheckout({
      customer,
      orderEmail: data.email,
      pointsToRedeem: data.pointsToRedeem ?? 0,
      subtotalAfterCouponMkd: subtotalAfterCoupon,
    });
    if (!pointsValidation.ok) {
      return NextResponse.json(
        {
          error: pointsValidation.message,
          code: `points_${pointsValidation.code}`,
        },
        { status: 400 },
      );
    }
    pointsCharged = pointsValidation.redemption.pointsCharged;
    pointsDiscountAmount = pointsValidation.redemption.pointsDiscountAmount;
    totalAmount = Math.max(0, subtotalAfterCoupon - pointsDiscountAmount);

    const orderId = nanoid();
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    let itemsForStorage = data.items;
    try {
      itemsForStorage = await persistOrderPrintSvgs(orderNumber, itemsForStorage);
      itemsForStorage = await persistOrderPrintPngs(orderNumber, itemsForStorage);
    } catch (printStorageError) {
      console.error('[orders] print asset storage failed:', printStorageError);
      return NextResponse.json(
        {
          error: 'Failed to store print files for this order',
          code: 'order_print_storage_failed',
        },
        { status: 500 },
      );
    }

    const orderPayload = { ...data, items: itemsForStorage };

    await db.orders.insert({
      id: orderId,
      orderNumber,
      status: 'pending',
      paymentMethod: 'cod',
      locale: data.locale,
      customerName: data.fullName,
      customerPhone: data.phone,
      customerEmail: data.email || null,
      customerCity: data.city,
      customerAddress: data.address,
      fulfillmentMethod: data.fulfillmentMethod,
      notes: data.notes || null,
      itemsJson: JSON.stringify(itemsForStorage),
      fileIdsJson: data.fileIds ? JSON.stringify(data.fileIds) : null,
      totalAmount,
      subtotalAmount,
      discountAmount,
      couponCode: appliedCouponCode,
      customerId,
      pointsRedeemed: pointsCharged,
      pointsDiscountAmount,
      createdAt: now,
    });

    try {
      const { reservedCount } = await reserveExclusiveDesignsForOrder(
        orderId,
        itemsForStorage,
      );
      // Only exclusive inventory changes need catalog-designs Data Cache bust.
      // Do not rewrite homepage ISR (home uses a separate featured tag).
      if (reservedCount > 0) {
        revalidateDesignCatalogCache();
      }
    } catch (reserveError) {
      await db.orders.updateStatus(orderId, 'cancelled');
      console.error('[orders] exclusive design reservation failed:', reserveError);
      return NextResponse.json(
        {
          error: 'One or more exclusive designs are no longer available',
          code: 'design_unavailable',
        },
        { status: 409 },
      );
    }

    if (appliedCouponId && appliedCouponCode) {
      try {
        await recordCouponRedemption({
          couponId: appliedCouponId,
          orderId,
          orderNumber,
          discountAmount,
          customerEmail: data.email,
          customerPhone: data.phone,
        });
      } catch (redeemError) {
        await db.orders.updateStatus(orderId, 'cancelled');
        // Keep inventory consistent with admin cancel path.
        try {
          const { availabilityChanged } = await syncExclusiveDesignsForOrderStatus(
            orderId,
            'cancelled',
            itemsForStorage,
          );
          if (availabilityChanged) {
            revalidateDesignCatalogCache();
          }
        } catch (releaseError) {
          console.error(
            '[orders] exclusive release after coupon fail:',
            releaseError,
          );
        }
        console.error('[orders] coupon redemption failed:', redeemError);
        return NextResponse.json(
          {
            error: 'Coupon could not be applied (possibly already used)',
            code: 'coupon_redeem_failed',
          },
          { status: 409 },
        );
      }
    }

    if (pointsCharged > 0 && customerId) {
      try {
        await redeemPointsForOrder({
          customerId,
          orderId,
          pointsCharged,
          discountMkd: pointsDiscountAmount,
        });
      } catch (redeemError) {
        await db.orders.updateStatus(orderId, 'cancelled');
        try {
          const { availabilityChanged } = await syncExclusiveDesignsForOrderStatus(
            orderId,
            'cancelled',
            itemsForStorage,
          );
          if (availabilityChanged) {
            revalidateDesignCatalogCache();
          }
        } catch (releaseError) {
          console.error(
            '[orders] exclusive release after points fail:',
            releaseError,
          );
        }
        console.error('[orders] points redemption failed:', redeemError);
        return NextResponse.json(
          {
            error: 'Points could not be applied',
            code: 'points_redeem_failed',
          },
          { status: 409 },
        );
      }
    }

    let pointsEarnedThisOrder = 0;
    if (customerId) {
      try {
        const reserved = await reservePendingPointsForOrder({
          customerId,
          orderId,
          cashPaidMkd: totalAmount,
        });
        pointsEarnedThisOrder = reserved.total;
      } catch (pendingError) {
        console.error('[orders] pending points reserve failed:', pendingError);
      }
    }

    let loyaltyForEmail:
      | {
          pointsEarnedThisOrder: number;
          pointsBalance: number;
          pointsPendingBalance: number;
        }
      | undefined;
    const accountCustomer =
      customer ??
      (data.email ? await customersDb.findByEmailNormalized(data.email) : null);
    if (accountCustomer) {
      const freshCustomer = await customersDb.findById(accountCustomer.id);
      if (freshCustomer) {
        loyaltyForEmail = {
          pointsEarnedThisOrder,
          pointsBalance: freshCustomer.pointsBalance,
          pointsPendingBalance: freshCustomer.pointsPendingBalance,
        };
      }
    }

    let rewardCoupon: { code: string; amount: number; endsAt: string | null } | null =
      null;
    try {
      const tiers = await listRewardTiers();
      const tier = pickBestRewardTier(tiers, subtotalAmount);
      if (tier) {
        const issued = await issueRewardCoupon({
          discountAmount: tier.rewardAmount,
          minOrderAmount: tier.rewardMinOrderAmount,
          validDays: tier.rewardValidDays,
          email: data.email,
          fromOrderId: orderId,
        });
        rewardCoupon = {
          code: issued.code,
          amount: issued.discountAmount,
          endsAt: issued.endsAt,
        };
      }
    } catch (rewardError) {
      console.error('[orders] reward coupon issue failed:', rewardError);
    }

    const newsletterEmail = data.newsletterOptIn ? data.email : null;
    const newsletterLocale = data.locale;

    after(async () => {
      try {
        await sendOrderEmails(orderNumber, orderPayload, totalAmount, {
          discountAmount,
          subtotalAmount,
          couponCode: appliedCouponCode,
          rewardCoupon,
          loyalty: loyaltyForEmail,
        });
      } catch (emailError) {
        console.error('[orders] email delivery failed:', emailError);
      }

      if (newsletterEmail) {
        try {
          await subscribeToNewsletter({
            email: newsletterEmail,
            locale: newsletterLocale,
          });
        } catch (newsletterError) {
          console.error('[orders] newsletter subscribe failed:', newsletterError);
        }
      }
    });

    return NextResponse.json({
      orderId,
      orderNumber,
      totalAmount,
      discountAmount,
      subtotalAmount,
      pointsDiscountAmount,
      pointsRedeemed: pointsCharged,
      rewardCoupon,
    });
  } catch (err) {
    const errorId = nanoid(8);
    console.error(`[orders] create failed id=${errorId}`, err);
    return NextResponse.json(
      { error: 'Failed to create order', code: 'order_create_failed', errorId },
      { status: 500 },
    );
  }
}
