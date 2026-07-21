'use client';

import { useLayoutEffect, useRef } from 'react';
import { usePathname } from '@/i18n/navigation';

/**
 * Forces an instant scroll-to-top the moment a route change starts.
 *
 * The site opts in to `scroll-behavior: smooth` globally (for anchor links),
 * which also makes the browser/Next.js's own scroll-restoration animate on
 * every page navigation. On long, scrolled pages (especially mobile) that
 * animation takes long enough that the shorter next page (or its loading
 * skeleton) renders while we're still smooth-scrolling up, briefly exposing
 * the footer. Temporarily switching to instant scrolling for this one jump
 * avoids that flash without touching the deliberate smooth scrolls used
 * elsewhere (e.g. in-page anchor jumps).
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.style.scrollBehavior = previousScrollBehavior;
  }, [pathname]);

  return null;
}
