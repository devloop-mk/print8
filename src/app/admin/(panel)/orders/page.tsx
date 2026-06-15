import { Suspense } from 'react';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { AdminPageLoading } from '@/components/admin/AdminPageLoading';
import { listAdminOrders, type OrderSort } from '@/lib/admin/orders';
import { adminStrings } from '@/lib/admin/strings';
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
  const t = adminStrings.ordersPage;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">{t.title}</h1>
        <p className="text-sm text-ink-500">{t.shown(orders.length)}</p>
      </div>

      <Suspense fallback={<AdminPageLoading label={t.loading} />}>
        <OrdersTable orders={orders} />
      </Suspense>
    </div>
  );
}
