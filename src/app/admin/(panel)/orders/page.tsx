import { Suspense } from 'react';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { listAdminOrders, type OrderSort } from '@/lib/admin/orders';
import type { OrderStatus } from '@/lib/db';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    sort?: string;
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const status = (params.status ?? 'all') as OrderStatus | 'all';
  const sort = (params.sort ?? 'newest') as OrderSort;
  const search = params.search;

  const orders = await listAdminOrders({ status, sort, search });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Orders</h1>
        <p className="text-sm text-ink-500">
          {orders.length} order{orders.length === 1 ? '' : 's'} shown
        </p>
      </div>

      <Suspense fallback={<p className="text-sm text-ink-500">Loading orders…</p>}>
        <OrdersTable orders={orders} />
      </Suspense>
    </div>
  );
}
