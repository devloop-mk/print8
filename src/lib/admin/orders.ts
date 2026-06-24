import {
  db,
  type OrderRecord,
  type OrderStatus,
} from '@/lib/db';
import type { CheckoutInput } from '@/lib/validations/order';
import { collectOrderFileIds } from '@/lib/orders/order-assets';

export type OrderSort = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

export type OrderListItem = OrderRecord & {
  items: CheckoutInput['items'];
  fileIds: string[];
};

export interface AdminMetrics {
  totalOrders: number;
  ordersToday: number;
  ordersThisWeek: number;
  ordersThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  averageOrderValue: number;
  byStatus: Record<OrderStatus, number>;
  byLocale: { mk: number; en: number };
  byItemType: { service: number; design: number; product: number };
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(days: number) {
  const d = startOfDay();
  d.setDate(d.getDate() - days);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function listAdminOrders(options?: {
  status?: OrderStatus | 'all';
  sort?: OrderSort;
  search?: string;
  limit?: number;
}): Promise<OrderListItem[]> {
  const rows = await db.orders.list({
    status: options?.status,
    sort: options?.sort ?? 'newest',
    search: options?.search,
    limit: options?.limit,
  });

  return rows.map((row) => ({
    ...row,
    items: JSON.parse(row.itemsJson) as CheckoutInput['items'],
    fileIds: row.fileIdsJson ? (JSON.parse(row.fileIdsJson) as string[]) : [],
  }));
}

export async function getAdminOrder(id: string): Promise<OrderListItem | null> {
  const row = await db.orders.findById(id);
  if (!row) return null;

  return {
    ...row,
    items: JSON.parse(row.itemsJson) as CheckoutInput['items'],
    fileIds: row.fileIdsJson ? (JSON.parse(row.fileIdsJson) as string[]) : [],
  };
}

export async function updateAdminOrderStatus(id: string, status: OrderStatus) {
  return db.orders.updateStatus(id, status);
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const orders = await listAdminOrders();
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = daysAgo(7);
  const monthStart = startOfMonth(now);

  const byStatus: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    printing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  };

  const metrics: AdminMetrics = {
    totalOrders: orders.length,
    ordersToday: 0,
    ordersThisWeek: 0,
    ordersThisMonth: 0,
    totalRevenue: 0,
    revenueThisMonth: 0,
    averageOrderValue: 0,
    byStatus,
    byLocale: { mk: 0, en: 0 },
    byItemType: { service: 0, design: 0, product: 0 },
  };

  let revenueEligible = 0;
  let revenueSum = 0;

  for (const order of orders) {
    const createdAt = new Date(order.createdAt);
    byStatus[order.status] += 1;

    if (order.locale === 'mk') metrics.byLocale.mk += 1;
    if (order.locale === 'en') metrics.byLocale.en += 1;

    if (createdAt >= todayStart) metrics.ordersToday += 1;
    if (createdAt >= weekStart) metrics.ordersThisWeek += 1;
    if (createdAt >= monthStart) metrics.ordersThisMonth += 1;

    if (order.status !== 'cancelled') {
      metrics.totalRevenue += order.totalAmount;
      revenueSum += order.totalAmount;
      revenueEligible += 1;
      if (createdAt >= monthStart) {
        metrics.revenueThisMonth += order.totalAmount;
      }
    }

    for (const item of order.items) {
      metrics.byItemType[item.type] += item.quantity;
    }
  }

  metrics.averageOrderValue =
    revenueEligible > 0 ? Math.round(revenueSum / revenueEligible) : 0;

  return metrics;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'На чекање',
  confirmed: 'Потврдена',
  printing: 'Печати се',
  ready: 'Подготвена',
  delivered: 'Испорачана',
  cancelled: 'Откажана',
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  printing: 'bg-violet-100 text-violet-800',
  ready: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-ink-100 text-ink-700',
  cancelled: 'bg-red-100 text-red-800',
};
