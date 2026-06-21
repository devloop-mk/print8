'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

type ParallaxFloatProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
};

export function ParallaxFloat({
  children,
  className,
  strength = 0.12,
}: ParallaxFloatProps) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    let frame = 0;
    function onScroll() {
      if (!ref.current) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const elementCenter = rect.top + rect.height / 2;
        const offset = (elementCenter - viewportCenter) * strength;
        ref.current.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reducedMotion, strength]);

  return (
    <div
      ref={ref}
      className={cn('will-change-transform', className)}
      style={reducedMotion ? undefined : { transition: 'transform 0.1s linear' }}
    >
      {children}
    </div>
  );
}
