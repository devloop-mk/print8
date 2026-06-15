import Link from 'next/link';
import { MetricCard } from '@/components/admin/MetricCard';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { getAdminMetrics, listAdminOrders } from '@/lib/admin/orders';
import { getSiteMetrics } from '@/lib/admin/site-metrics';
import { formatPrice } from '@/lib/utils';
import type { OrderStatus } from '@/lib/db';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default async function AdminDashboardPage() {
  const [metrics, siteMetrics, recentOrders] = await Promise.all([
    getAdminMetrics(),
    getSiteMetrics(),
    listAdminOrders({ limit: 8 }),
  ]);

  const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'printing', 'ready'];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Dashboard</h1>
          <p className="text-sm text-ink-500">Orders, revenue, and website traffic.</p>
        </div>
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          View all orders →
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          Website traffic
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Page views today"
            value={String(siteMetrics.pageViewsToday)}
            hint={`${siteMetrics.uniqueVisitorsToday} unique visitors`}
          />
          <MetricCard
            label="Page views (7 days)"
            value={String(siteMetrics.pageViewsThisWeek)}
            hint={`${siteMetrics.uniqueVisitorsThisWeek} unique visitors`}
          />
          <MetricCard
            label="Page views (30 days)"
            value={String(siteMetrics.pageViewsThisMonth)}
            hint={`${siteMetrics.uniqueVisitorsThisMonth} unique visitors`}
          />
          <MetricCard
            label="All-time page views"
            value={String(siteMetrics.totalPageViews)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-ink-200 bg-white p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-ink-900">Top pages (7 days)</h3>
            {siteMetrics.topPages.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">
                No traffic recorded yet. Views appear as visitors browse the site.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-ink-100">
                {siteMetrics.topPages.map((page) => (
                  <div
                    key={page.path}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="truncate text-ink-700">{page.path}</span>
                    <span className="shrink-0 font-medium text-ink-900">{page.views}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-ink-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-ink-900">Traffic by locale</h3>
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
                  <span className="text-ink-600">Other</span>
                  <span className="font-medium">{siteMetrics.byLocale.other}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
          Orders & revenue
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total orders" value={String(metrics.totalOrders)} />
          <MetricCard
            label="Revenue (excl. cancelled)"
            value={formatPrice(metrics.totalRevenue, 'mk')}
          />
          <MetricCard
            label="This month"
            value={formatPrice(metrics.revenueThisMonth, 'mk')}
            hint={`${metrics.ordersThisMonth} orders`}
          />
          <MetricCard
            label="Average order"
            value={formatPrice(metrics.averageOrderValue, 'mk')}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-ink-200 bg-white p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-ink-900">Orders by status</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(Object.keys(metrics.byStatus) as OrderStatus[]).map((status) => (
                <div
                  key={status}
                  className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2"
                >
                  <OrderStatusBadge status={status} />
                  <span className="text-sm font-semibold text-ink-900">
                    {metrics.byStatus[status]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <MetricCard
              label="Orders today"
              value={String(metrics.ordersToday)}
            />
            <MetricCard
              label="Orders (7 days)"
              value={String(metrics.ordersThisWeek)}
            />
            <div className="rounded-xl border border-ink-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-ink-900">Orders by locale</h3>
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
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-900">Recent orders</h2>
          <p className="text-xs text-ink-500">
            {activeStatuses.reduce((sum, s) => sum + metrics.byStatus[s], 0)} active
          </p>
        </div>

        <div className="divide-y divide-ink-100">
          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">No orders yet.</p>
          ) : (
            recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-sm text-ink-600">{order.customerName}</p>
                  <p className="text-xs text-ink-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink-900">
                    {formatPrice(order.totalAmount, 'mk')}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
