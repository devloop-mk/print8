'use client';

import { usePathname } from '@/i18n/navigation';
import { Footer } from '@/components/layout/Footer';
import { useNavigationPending } from '@/hooks/useNavigationPending';

export function FooterGate() {
  const pathname = usePathname();
  const navPending = useNavigationPending();
  const hideFooter =
    navPending || pathname.includes('/products/customize/');

  if (hideFooter) return null;

  return <Footer />;
}
