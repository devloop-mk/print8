'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { sendPageView } from '@/lib/analytics/track-pageview';
import { hasAnalyticsConsent } from '@/lib/legal/cookie-consent';

export function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    function trackIfAllowed() {
      if (hasAnalyticsConsent()) {
        sendPageView(pathname);
      }
    }

    trackIfAllowed();

    function onConsentChange() {
      trackIfAllowed();
    }

    window.addEventListener('print8:cookie-consent', onConsentChange);
    return () => window.removeEventListener('print8:cookie-consent', onConsentChange);
  }, [pathname]);

  return null;
}
