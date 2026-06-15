import Link from 'next/link';
import { MetricCard } from '@/components/admin/MetricCard';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { TopPagesList } from '@/components/admin/TopPagesList';
import { getAdminMetrics, listAdminOrders } from '@/lib/admin/orders';
import { getSiteMetrics } from '@/lib/admin/site-metrics';
import { adminStrings, formatAdminDate } from '@/lib/admin/strings';
import { formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/lib/db';

export default async function AdminDashboardPage() {
  const [metrics, siteMetrics, recentOrders] = await Promise.all([
    getAdminMetrics(),
    getSiteMetrics(),
    listAdminOrders({ limit: 8 }),
  ]);

  const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'printing', 'ready'];
  const t = adminStrings.dashboardPage;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">{t.title}</h1>
          <p className="text-sm text-ink-500">{t.subtitle}</p>
        </div>
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          {t.allOrders}
        </Link>
      </div>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500 sm:text-sm">
          {t.trafficSection}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <MetricCard
            label={t.pageViewsToday}
            value={String(siteMetrics.pageViewsToday)}
            hint={t.uniqueVisitors(siteMetrics.uniqueVisitorsToday)}
          />
          <MetricCard
            label={t.pageViewsWeek}
            value={String(siteMetrics.pageViewsThisWeek)}
            hint={t.uniqueVisitors(siteMetrics.uniqueVisitorsThisWeek)}
          />
          <MetricCard
            label={t.pageViewsMonth}
            value={String(siteMetrics.pageViewsThisMonth)}
            hint={t.uniqueVisitors(siteMetrics.uniqueVisitorsThisMonth)}
          />
          <MetricCard
            label={t.pageViewsAll}
            value={String(siteMetrics.totalPageViews)}
            className="col-span-2 xl:col-span-1"
          />
        </div>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-ink-200 bg-white p-4 sm:p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-ink-900">{t.topPages}</h3>
            <TopPagesList pages={siteMetrics.topPages} />
          </div>

          <div className="rounded-xl border border-ink-200 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-ink-900">{t.trafficByLocale}</h3>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-600">MK</span>
                <span className="font-medium">{siteMetrics.byLocale.mk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">EN</span>
                <span className="font-medium">{siteMetrics.byLocale.en}</span>
              </div>
              {siteMetrics.byLocale.other > 0 ? (
                <div className="flex justify-between">
                  <span className="text-ink-600">{adminStrings.dashboardPage.other}</span>
                  <span className="font-medium">{siteMetrics.byLocale.other}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500 sm:text-sm">
          {t.ordersSection}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <MetricCard label={t.totalOrders} value={String(metrics.totalOrders)} />
          <MetricCard label={t.revenue} value={formatPrice(metrics.totalRevenue, 'mk')} />
          <MetricCard
            label={t.thisMonth}
            value={formatPrice(metrics.revenueThisMonth, 'mk')}
            hint={t.ordersCount(metrics.ordersThisMonth)}
          />
          <MetricCard
            label={t.averageOrder}
            value={formatPrice(metrics.averageOrderValue, 'mk')}
            className="col-span-2 xl:col-span-1"
          />
        </div>

        <div className="grid gap-3 sm:gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-ink-200 bg-white p-4 sm:p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-ink-900">{t.ordersByStatus}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
              {(Object.keys(metrics.byStatus) as OrderStatus[]).map((status) => (
                <div
                  key={status}
                  className="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-2.5 py-2 sm:px-3"
                >
                  <OrderStatusBadge status={status} className="truncate" />
                  <span className="shrink-0 text-sm font-semibold text-ink-900">
                    {metrics.byStatus[status]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:space-y-0 lg:grid-cols-1 lg:gap-4">
            <MetricCard label={t.ordersToday} value={String(metrics.ordersToday)} />
            <MetricCard label={t.ordersWeek} value={String(metrics.ordersThisWeek)} />
            <div className="col-span-2 rounded-xl border border-ink-200 bg-white p-4 sm:col-span-1 sm:p-5">
              <h3 className="text-sm font-semibold text-ink-900">{t.ordersByLocale}</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600">MK</span>
                  <span className="font-medium">{metrics.byLocale.mk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">EN</span>
                  <span className="font-medium">{metrics.byLocale.en}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-ink-200 bg-white">
        <div className="flex items-center justify-between gap-2 border-b border-ink-100 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-sm font-semibold text-ink-900">{t.recentOrders}</h2>
          <p className="shrink-0 text-xs text-ink-500">
            {t.activeOrders(activeStatuses.reduce((sum, s) => sum + metrics.byStatus[s], 0))}
          </p>
        </div>

        <div className="divide-y divide-ink-100">
          {recentOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-500 sm:px-5">{t.noOrders}</p>
          ) : (
            recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex flex-col gap-2 px-4 py-3 active:bg-ink-50 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-brand-700">{order.orderNumber}</p>
                  <p className="truncate text-sm text-ink-600">{order.customerName}</p>
                  <p className="text-xs text-ink-400">{formatAdminDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-sm font-medium text-ink-900">
                    {formatPrice(order.totalAmount, 'mk')}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
