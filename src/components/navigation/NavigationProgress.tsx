'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [active, setActive] = useState(false);
  const [complete, setComplete] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return;
      }

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      if (href.startsWith('http') && !href.startsWith(window.location.origin)) {
        return;
      }

      setActive(true);
      setComplete(false);
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    setActive(true);
    setComplete(false);

    if (completeTimer.current) clearTimeout(completeTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);

    completeTimer.current = setTimeout(() => setComplete(true), 250);
    hideTimer.current = setTimeout(() => {
      setActive(false);
      setComplete(false);
    }, 650);

    return () => {
      if (completeTimer.current) clearTimeout(completeTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [routeKey]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-brand-100"
      aria-hidden
    >
      <div
        className={cn(
          'h-full bg-brand-600 transition-all duration-500 ease-out',
          complete ? 'w-full opacity-0' : 'w-2/3 opacity-100',
        )}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  );
}
