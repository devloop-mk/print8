'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function SiteAnalytics() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const locale = pathname.startsWith('/en')
      ? 'en'
      : pathname.startsWith('/mk')
        ? 'mk'
        : null;

    fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, locale }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
