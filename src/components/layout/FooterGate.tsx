'use client';

import { usePathname } from '@/i18n/navigation';
import { Footer } from '@/components/layout/Footer';

export function FooterGate() {
  const pathname = usePathname();
  const hideFooter = pathname.includes('/products/customize/');

  if (hideFooter) return null;

  return <Footer />;
}
