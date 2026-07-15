import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { checkoutSchema } from '@/lib/validations/order';
import { generateOrderNumber } from '@/lib/utils';
import { sendOrderEmails } from '@/lib/email/order-emails';
import { validateOrderAssetLimits } from '@/lib/orders/order-assets';
import { validateOrderPrices } from '@/lib/orders/validate-order-prices';
import { validateOrderUploadFiles } from '@/lib/orders/validate-order-uploads';
import {
  reserveExclusiveDesignsForOrder,
  validateExclusiveDesignsAvailable,
} from '@/lib/designs/design-reservations';
import { revalidateDesignCatalogCache } from '@/lib/catalog/revalidate-design-catalog';
import { enforceRateLimit } from '@/lib/security/rate-limit';

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

    const data = parsed.data;

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

    const totalAmount = priceValidation.totalAmount;

    const orderId = nanoid();
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

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
      notes: data.notes || null,
      itemsJson: JSON.stringify(data.items),
      fileIdsJson: data.fileIds ? JSON.stringify(data.fileIds) : null,
      totalAmount,
      createdAt: now,
    });

    try {
      await reserveExclusiveDesignsForOrder(orderId, data.items);
      revalidateDesignCatalogCache();
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

    try {
      await sendOrderEmails(orderNumber, data, totalAmount);
    } catch (emailError) {
      console.error('[orders] email delivery failed:', emailError);
    }

    return NextResponse.json({ orderId, orderNumber });
  } catch (err) {
    const errorId = nanoid(8);
    console.error(`[orders] create failed id=${errorId}`, err);
    return NextResponse.json(
      { error: 'Failed to create order', code: 'order_create_failed', errorId },
      { status: 500 },
    );
  }
}
