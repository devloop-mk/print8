'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

type ParallaxFloatProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
  scaleStrength?: number;
};

export function ParallaxFloat({
  children,
  className,
  strength = 0.18,
  scaleStrength = 0.00012,
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
        const scale = 1 + Math.abs(offset) * scaleStrength;
        ref.current.style.transform = `translate3d(0, ${offset}px, 0) scale(${scale})`;
      });
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reducedMotion, strength, scaleStrength]);

  return (
    <div ref={ref} className={cn('will-change-transform', className)}>
      {children}
    </div>
  );
}
