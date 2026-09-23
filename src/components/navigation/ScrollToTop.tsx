'use client';

import { useLayoutEffect, useRef } from 'react';
import { usePathname } from '@/i18n/navigation';

const SCROLL_POSITIONS_KEY = 'print8_scroll_positions';
const SCROLL_POSITIONS_LIMIT = 40;

function unlockBodyScroll() {
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
}

function pageKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function readScrollPositions(): Map<string, number> {
  try {
    const raw = sessionStorage.getItem(SCROLL_POSITIONS_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as [string, number][];
    if (!Array.isArray(parsed)) return new Map();
    return new Map(parsed);
  } catch {
    return new Map();
  }
}

function writeScrollPositions(positions: Map<string, number>) {
  try {
    const entries = [...positions.entries()].slice(-SCROLL_POSITIONS_LIMIT);
    sessionStorage.setItem(SCROLL_POSITIONS_KEY, JSON.stringify(entries));
  } catch {
    // Private mode / quota — skip persistence.
  }
}

function persistScroll(y: number, key = pageKey()) {
  const positions = readScrollPositions();
  positions.set(key, Math.max(0, Math.round(y)));
  writeScrollPositions(positions);
}

function readPersistedScroll(key = pageKey()): number | undefined {
  const y = readScrollPositions().get(key);
  return typeof y === 'number' && Number.isFinite(y) ? y : undefined;
}

function scrollToYInstant(y: number) {
  unlockBodyScroll();

  const html = document.documentElement;
  const body = document.body;
  const scrollingElement = document.scrollingElement;
  const top = Math.max(0, y);

  const previousScrollBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';

  window.scrollTo(0, top);
  try {
    window.scrollTo({ top, left: 0, behavior: 'instant' });
  } catch {
    window.scrollTo({ top, left: 0, behavior: 'auto' });
  }

  html.scrollTop = top;
  body.scrollTop = top;
  if (scrollingElement) scrollingElement.scrollTop = top;

  html.style.scrollBehavior = previousScrollBehavior;
}

function scheduleScrollTo(y: number): () => void {
  let stopped = false;
  const apply = () => {
    if (!stopped) scrollToYInstant(y);
  };

  apply();
  let raf2 = 0;
  const raf1 = requestAnimationFrame(() => {
    apply();
    raf2 = requestAnimationFrame(apply);
  });
  const timers = [50, 120, 350, 700].map((ms) => window.setTimeout(apply, ms));

  return () => {
    stopped = true;
    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);
    for (const timer of timers) window.clearTimeout(timer);
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
 * Instant scroll on forward navigations. Browser / in-app back restores the
 * previous page’s scroll so catalog grids don’t jump to the top.
 *
 * `history.scrollRestoration` stays manual because global `scroll-behavior:
 * smooth` otherwise animates mid-transition on mobile.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const lastScrollY = useRef(0);
  const ignoreScrollSave = useRef(false);
  const pendingPop = useRef(false);
  const cancelScheduled = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    lastScrollY.current = window.scrollY || 0;
    let persistRaf = 0;

    function persistLatest() {
      persistRaf = 0;
      if (ignoreScrollSave.current) return;
      persistScroll(lastScrollY.current);
    }

    function onScroll() {
      lastScrollY.current = window.scrollY || 0;
      if (ignoreScrollSave.current || persistRaf) return;
      persistRaf = requestAnimationFrame(persistLatest);
    }

    function onPopState() {
      pendingPop.current = true;
      ignoreScrollSave.current = true;
      cancelScheduled.current?.();
      const y = readPersistedScroll() ?? 0;
      cancelScheduled.current = scheduleScrollTo(y);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('popstate', onPopState);
    window.addEventListener('pagehide', persistLatest);
    return () => {
      if (persistRaf) cancelAnimationFrame(persistRaf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('pagehide', persistLatest);
    };
  }, []);

  useLayoutEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor || !isInternalNavAnchor(anchor)) return;

      persistScroll(lastScrollY.current);
      ignoreScrollSave.current = true;
      cancelScheduled.current?.();
      cancelScheduled.current = scheduleScrollTo(0);
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      ignoreScrollSave.current = false;
      return;
    }

    cancelScheduled.current?.();

    if (pendingPop.current) {
      pendingPop.current = false;
      const y = readPersistedScroll() ?? 0;
      cancelScheduled.current = scheduleScrollTo(y);
      ignoreScrollSave.current = false;
      return () => cancelScheduled.current?.();
    }

    ignoreScrollSave.current = false;
    cancelScheduled.current = scheduleScrollTo(0);
    return () => cancelScheduled.current?.();
  }, [pathname]);

  return null;
}
