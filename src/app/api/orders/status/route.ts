import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { enforceRateLimit } from '@/lib/security/rate-limit';

const schema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  phone: z.string().trim().min(8).max(20),
});

export async function POST(request: NextRequest) {
  const rateLimited = enforceRateLimit(request, 'order-status', 20, 60 * 60 * 1000);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid lookup data', code: 'invalid_lookup' },
        { status: 400 },
      );
    }

    const order = await db.orders.findByOrderNumberAndPhone(
      parsed.data.orderNumber,
      parsed.data.phone,
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found', code: 'not_found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentMethod: order.fulfillmentMethod,
      totalAmount: order.totalAmount,
      locale: order.locale,
      createdAt: order.createdAt,
      itemCount: (() => {
        try {
          const items = JSON.parse(order.itemsJson) as unknown[];
          return Array.isArray(items) ? items.length : 0;
        } catch {
          return 0;
        }
      })(),
    });
  } catch (error) {
    console.error('[order-status] lookup failed', error);
    return NextResponse.json(
      { error: 'Lookup failed', code: 'lookup_failed' },
      { status: 500 },
    );
  }
}
