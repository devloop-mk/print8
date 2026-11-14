'use client';

import { usePathname } from '@/i18n/navigation';
import { Header } from '@/components/layout/Header';

export function HeaderGate() {
  const pathname = usePathname();
  if (pathname === '/catalog' || pathname.startsWith('/catalog/')) return null;
  return <Header />;
}
