'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/account', key: 'overview' as const },
  { href: '/account/orders', key: 'orders' as const },
  { href: '/account/points', key: 'points' as const },
  { href: '/account/rewards', key: 'rewards' as const },
  { href: '/account/details', key: 'details' as const },
];

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/account') {
    return pathname === '/account' || pathname.endsWith('/account');
  }
  return pathname === href || pathname.endsWith(href);
}

export function AccountNav() {
  const t = useTranslations('account.nav');
  const pathname = usePathname();

  return (
    <nav
      className="flex min-w-0 gap-1 overflow-x-auto border-b border-ink-200 pb-px lg:w-44 lg:flex-col lg:gap-0.5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6"
      aria-label={t('ariaLabel')}
    >
      {navItems.map((item) => {
        const active = isNavActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'shrink-0 px-3 py-2.5 text-sm font-medium transition-colors lg:rounded-md lg:px-3 lg:py-2',
              active
                ? 'border-b-2 border-brand-600 text-brand-800 lg:border-b-0 lg:bg-brand-50 lg:text-brand-900'
                : 'border-b-2 border-transparent text-ink-600 hover:text-ink-900 lg:border-b-0 lg:hover:bg-ink-50',
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
