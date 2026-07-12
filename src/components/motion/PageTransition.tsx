'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const isFirstRender = useRef(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      setVisible(true);
      return;
    }

    setVisible(false);
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, reducedMotion]);

  if (reducedMotion) {
    return <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>;
  }

  return (
    <div
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col transition-opacity duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {children}
    </div>
  );
}
