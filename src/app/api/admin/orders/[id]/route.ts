import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { getAdminOrder, updateAdminOrderStatus } from '@/lib/admin/orders';
import { revalidateDesignCatalogCache } from '@/lib/catalog/revalidate-design-catalog';
import type { OrderStatus } from '@/lib/db';

const statusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'printing',
    'ready',
    'delivered',
    'cancelled',
  ]),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existing = await getAdminOrder(id);
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { updated, availabilityChanged } = await updateAdminOrderStatus(
      id,
      parsed.data.status as OrderStatus,
    );
    // Exclusive sold/reserved/released is the only reason catalog-designs must refresh.
    if (availabilityChanged) {
      revalidateDesignCatalogCache();
    }
    const order = await getAdminOrder(updated.id);
    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
