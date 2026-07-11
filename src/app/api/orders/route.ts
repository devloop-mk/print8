import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { checkoutSchema } from '@/lib/validations/order';
import { generateOrderNumber } from '@/lib/utils';
import { sendOrderEmails } from '@/lib/email/order-emails';
import { validateOrderAssetLimits } from '@/lib/orders/order-assets';
import {
  reserveExclusiveDesignsForOrder,
  validateExclusiveDesignsAvailable,
} from '@/lib/designs/design-reservations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order data', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

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

    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

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
  } catch {
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 },
    );
  }
}
