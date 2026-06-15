import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { listAdminOrders, type OrderSort } from '@/lib/admin/orders';
import type { OrderStatus } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const { searchParams } = request.nextUrl;
  const status = (searchParams.get('status') ?? 'all') as OrderStatus | 'all';
  const sort = (searchParams.get('sort') ?? 'newest') as OrderSort;
  const search = searchParams.get('search') ?? undefined;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number(limitParam) : undefined;

  const orders = await listAdminOrders({
    status,
    sort,
    search,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return NextResponse.json({ orders });
}
