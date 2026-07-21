'use client';

import { useLayoutEffect, useRef } from 'react';
import { usePathname } from '@/i18n/navigation';

function scrollToTopInstant() {
  const html = document.documentElement;
  const previousScrollBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  html.style.scrollBehavior = previousScrollBehavior;
}

function isInternalNavAnchor(anchor: HTMLAnchorElement): boolean {
  if (anchor.target === '_blank' || anchor.hasAttribute('download')) {
    return false;
  }

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }

  if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
    return false;
  }

  const url = new URL(href, window.location.href);
  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return false;
  }

  return true;
}

/**
 * Forces an instant scroll-to-top when a route change starts.
 *
 * The site opts in to `scroll-behavior: smooth` globally (for anchor links),
 * which also makes the browser/Next.js's own scroll-restoration animate on
 * every page navigation. On long, scrolled pages (especially mobile) that
 * animation takes long enough that the shorter next page (or its loading
 * skeleton) renders while we're still smooth-scrolling up, briefly exposing
 * the footer.
 *
 * We scroll on the *click* (before content swaps) and again on pathname
 * change, always with `scroll-behavior: auto` for that jump.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor || !isInternalNavAnchor(anchor)) return;

      scrollToTopInstant();
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    scrollToTopInstant();
  }, [pathname]);

  return null;
}
