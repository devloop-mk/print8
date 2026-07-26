'use client';

import { useLayoutEffect, useRef } from 'react';
import { usePathname } from '@/i18n/navigation';

function unlockBodyScroll() {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
}

function scrollToTopInstant() {
  unlockBodyScroll();

  const html = document.documentElement;
  const body = document.body;
  const scrollingElement = document.scrollingElement;

  const previousScrollBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';

  window.scrollTo(0, 0);
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  html.scrollTop = 0;
  body.scrollTop = 0;
  if (scrollingElement) scrollingElement.scrollTop = 0;

  html.style.scrollBehavior = previousScrollBehavior;
}

function scheduleScrollToTop(): () => void {
  scrollToTopInstant();
  let raf1 = 0;
  let raf2 = 0;
  raf1 = requestAnimationFrame(() => {
    scrollToTopInstant();
    raf2 = requestAnimationFrame(scrollToTopInstant);
  });
  const t1 = window.setTimeout(scrollToTopInstant, 50);
  const t2 = window.setTimeout(scrollToTopInstant, 350);

  return () => {
    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);
    window.clearTimeout(t1);
    window.clearTimeout(t2);
  };
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
 * Global `scroll-behavior: smooth` makes default navigation scroll animate; on
 * mobile that often finishes mid-transition and leaves a small offset. Mobile
 * nav also sets `body { overflow: hidden }` while open, which blocks scroll
 * resets until the drawer closes — we unlock and re-scroll after that.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor || !isInternalNavAnchor(anchor)) return;

      scheduleScrollToTop();
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    return scheduleScrollToTop();
  }, [pathname]);

  return null;
}
