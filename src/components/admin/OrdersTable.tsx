'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { OrderListItem, OrderSort } from '@/lib/admin/orders';
import type { OrderStatus } from '@/lib/db';
import { ORDER_STATUS_LABELS } from '@/lib/admin/orders';
import { adminStrings, formatAdminDate } from '@/lib/admin/strings';
import { formatPrice } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

const SORT_OPTIONS: { value: OrderSort; label: string }[] = [
  { value: 'newest', label: adminStrings.sort.newest },
  { value: 'oldest', label: adminStrings.sort.oldest },
  { value: 'amount_high', label: adminStrings.sort.amount_high },
  { value: 'amount_low', label: adminStrings.sort.amount_low },
];

const STATUS_OPTIONS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: adminStrings.ordersTable.allStatuses },
  ...(['pending', 'confirmed', 'printing', 'ready', 'delivered', 'cancelled'] as OrderStatus[]).map(
    (status) => ({
      value: status,
      label: ORDER_STATUS_LABELS[status],
    }),
  ),
];

export function OrdersTable({ orders }: { orders: OrderListItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = adminStrings.ordersTable;

  const status = (searchParams.get('status') ?? 'all') as OrderStatus | 'all';
  const sort = (searchParams.get('sort') ?? 'newest') as OrderSort;
  const search = searchParams.get('search') ?? '';

  function updateParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    startTransition(() => {
      router.push(`/admin/orders?${params.toString()}`);
    });
  }

  function applySearch() {
    const input = document.getElementById('search') as HTMLInputElement | null;
    updateParams({ search: input?.value ?? '', status, sort });
  }

  return (
    <div className="relative space-y-4">
      {isPending ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/75 backdrop-blur-[1px]">
          <LoadingIndicator label={adminStrings.ordersPage.loading} size="md" />
        </div>
      ) : null}

      <div className="rounded-xl border border-ink-200 bg-white p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="search" className="mb-1 block text-sm font-medium text-ink-700">
              {t.search}
            </label>
            <input
              id="search"
              type="search"
              defaultValue={search}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm outline-none ring-brand-500 focus:ring-2"
              onKeyDown={(event) => {
                if (event.key === 'Enter') applySearch();
              }}
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-ink-700">
              {t.status}
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) =>
                updateParams({ status: event.target.value, search })
              }
              className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm outline-none ring-brand-500 focus:ring-2"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort" className="mb-1 block text-sm font-medium text-ink-700">
              {adminStrings.ordersTable.sortBy}
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value, status, search })}
              className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm outline-none ring-brand-500 focus:ring-2"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={applySearch}>
            {t.apply}
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white px-4 py-10 text-center text-sm text-ink-500">
          {t.empty}
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="block rounded-xl border border-ink-200 bg-white p-4 active:bg-ink-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-700">{order.orderNumber}</p>
                    <p className="mt-0.5 truncate text-sm text-ink-900">{order.customerName}</p>
                    <p className="text-xs text-ink-500">{order.customerPhone}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 text-sm">
                  <span className="text-ink-500">
                    {t.itemCount(order.items.length)} · {formatAdminDate(order.createdAt)}
                  </span>
                  <span className="font-semibold text-ink-900">
                    {formatPrice(order.totalAmount, 'mk')}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-ink-200 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-ink-200 text-sm">
                <thead className="bg-ink-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-ink-600">{t.order}</th>
                    <th className="px-4 py-3 text-left font-medium text-ink-600">{t.customer}</th>
                    <th className="px-4 py-3 text-left font-medium text-ink-600">{t.items}</th>
                    <th className="px-4 py-3 text-left font-medium text-ink-600">{t.total}</th>
                    <th className="px-4 py-3 text-left font-medium text-ink-600">{t.status}</th>
                    <th className="px-4 py-3 text-left font-medium text-ink-600">{t.date}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-ink-50/60">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-brand-700 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs uppercase text-ink-400">{order.locale}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-900">{order.customerName}</p>
                        <p className="text-ink-500">{order.customerPhone}</p>
                        {order.customerEmail ? (
                          <p className="text-ink-500">{order.customerEmail}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-ink-600">
                        {t.itemCount(order.items.length)}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-900">
                        {formatPrice(order.totalAmount, 'mk')}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-ink-600 whitespace-nowrap">
                        {formatAdminDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
