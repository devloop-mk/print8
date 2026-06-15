'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { OrderListItem, OrderSort } from '@/lib/admin/orders';
import type { OrderStatus } from '@/lib/db';
import { ORDER_STATUS_LABELS } from '@/lib/admin/orders';
import { formatPrice } from '@/lib/utils';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { Button } from '@/components/ui/Button';

const SORT_OPTIONS: { value: OrderSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount_high', label: 'Highest amount' },
  { value: 'amount_low', label: 'Lowest amount' },
];

const STATUS_OPTIONS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  ...(['pending', 'confirmed', 'printing', 'ready', 'delivered', 'cancelled'] as OrderStatus[]).map(
    (status) => ({
      value: status,
      label: ORDER_STATUS_LABELS[status],
    }),
  ),
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function OrdersTable({ orders }: { orders: OrderListItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
    router.push(`/admin/orders?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label htmlFor="search" className="mb-1 block text-sm font-medium text-ink-700">
            Search
          </label>
          <input
            id="search"
            type="search"
            defaultValue={search}
            placeholder="Order #, name, phone, email, city…"
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                updateParams({ search: (event.target as HTMLInputElement).value });
              }
            }}
          />
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-ink-700">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(event) =>
              updateParams({ status: event.target.value, search })
            }
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2 md:min-w-40"
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
            Sort by
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value, status, search })}
            className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2 md:min-w-44"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const input = document.getElementById('search') as HTMLInputElement | null;
            updateParams({ search: input?.value ?? '', status, sort });
          }}
        >
          Apply
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-ink-200 text-sm">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-ink-600">Order</th>
                <th className="px-4 py-3 text-left font-medium text-ink-600">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-ink-600">Items</th>
                <th className="px-4 py-3 text-left font-medium text-ink-600">Total</th>
                <th className="px-4 py-3 text-left font-medium text-ink-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-ink-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                    No orders match your filters.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
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
                      {order.items.length} item{order.items.length === 1 ? '' : 's'}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {formatPrice(order.totalAmount, 'mk')}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-600">{formatDate(order.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
