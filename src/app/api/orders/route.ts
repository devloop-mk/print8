import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { checkoutSchema } from "@/lib/validations/order";
import { generateOrderNumber } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid order data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const orderId = nanoid();
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    db.orders.insert({
      id: orderId,
      orderNumber,
      status: "pending",
      paymentMethod: "cod",
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

    return NextResponse.json({ orderId, orderNumber });
  } catch {
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
