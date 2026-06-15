import { db } from '@/lib/db';

export interface SiteMetrics {
  totalPageViews: number;
  pageViewsToday: number;
  pageViewsThisWeek: number;
  pageViewsThisMonth: number;
  uniqueVisitorsToday: number;
  uniqueVisitorsThisWeek: number;
  uniqueVisitorsThisMonth: number;
  byLocale: { mk: number; en: number; other: number };
  topPages: Array<{ path: string; views: number }>;
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

export async function getSiteMetrics(): Promise<SiteMetrics> {
  const empty: SiteMetrics = {
    totalPageViews: 0,
    pageViewsToday: 0,
    pageViewsThisWeek: 0,
    pageViewsThisMonth: 0,
    uniqueVisitorsToday: 0,
    uniqueVisitorsThisWeek: 0,
    uniqueVisitorsThisMonth: 0,
    byLocale: { mk: 0, en: 0, other: 0 },
    topPages: [],
  };

  try {
    const since = daysAgo(90).toISOString();
    const views = await db.pageViews.listSince(since);

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = daysAgo(7);
    const monthStart = startOfMonth(now);

    const metrics: SiteMetrics = {
      totalPageViews: views.length,
      pageViewsToday: 0,
      pageViewsThisWeek: 0,
      pageViewsThisMonth: 0,
      uniqueVisitorsToday: 0,
      uniqueVisitorsThisWeek: 0,
      uniqueVisitorsThisMonth: 0,
      byLocale: { mk: 0, en: 0, other: 0 },
      topPages: [],
    };

    const visitorsToday = new Set<string>();
    const visitorsWeek = new Set<string>();
    const visitorsMonth = new Set<string>();
    const pageCounts = new Map<string, number>();

    for (const view of views) {
      const createdAt = new Date(view.createdAt);

      if (createdAt >= todayStart) {
        metrics.pageViewsToday += 1;
        visitorsToday.add(view.visitorId);
      }
      if (createdAt >= weekStart) {
        metrics.pageViewsThisWeek += 1;
        visitorsWeek.add(view.visitorId);
        pageCounts.set(view.path, (pageCounts.get(view.path) ?? 0) + 1);
      }
      if (createdAt >= monthStart) {
        metrics.pageViewsThisMonth += 1;
        visitorsMonth.add(view.visitorId);
      }

      if (view.locale === 'mk') metrics.byLocale.mk += 1;
      else if (view.locale === 'en') metrics.byLocale.en += 1;
      else metrics.byLocale.other += 1;
    }

    metrics.uniqueVisitorsToday = visitorsToday.size;
    metrics.uniqueVisitorsThisWeek = visitorsWeek.size;
    metrics.uniqueVisitorsThisMonth = visitorsMonth.size;

    metrics.topPages = [...pageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([path, count]) => ({ path, views: count }));

    return metrics;
  } catch {
    return empty;
  }
}
