'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { adminStrings } from '@/lib/admin/strings';
import { cn } from '@/lib/utils';
import { NavigationProgress } from '@/components/navigation/NavigationProgress';

const NAV_ITEMS = [
  {
    href: '/admin',
    label: adminStrings.dashboard,
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/orders',
    label: adminStrings.orders,
    icon: Package,
    exact: false,
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <NavigationProgress />
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-56 shrink-0 border-r border-ink-200 bg-white px-3 py-5 lg:block xl:w-64 xl:px-4 xl:py-6">
          <div className="mb-8 px-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              {adminStrings.brand}
            </p>
            <h1 className="text-lg font-semibold text-ink-900">{adminStrings.admin}</h1>
          </div>

          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 space-y-1 border-t border-ink-100 pt-4">
            <a
              href="/mk"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              {adminStrings.viewWebsite}
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {adminStrings.logout}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink-200 bg-white/95 px-3 py-3 backdrop-blur md:px-6 lg:hidden">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                {adminStrings.brand}
              </p>
              <p className="text-sm font-medium text-ink-900">{adminStrings.admin}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-2 py-1.5 text-sm text-ink-600 hover:bg-ink-50"
            >
              {adminStrings.logout}
            </button>
          </header>

          <main className="flex-1 px-3 py-4 pb-24 md:px-6 md:py-6 md:pb-6 lg:px-8">
            {children}
          </main>

          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-7xl items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
              {NAV_ITEMS.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition',
                      active ? 'text-brand-700' : 'text-ink-500',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
              <a
                href="/mk"
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-ink-500"
              >
                <ExternalLink className="h-5 w-5" />
                <span className="truncate">Сајт</span>
              </a>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
