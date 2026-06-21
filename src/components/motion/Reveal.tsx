'use client';

import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useInView } from '@/hooks/useInView';
import { cn } from '@/lib/utils';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
  duration = 500,
}: RevealProps) {
  const reducedMotion = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>({
    rootMargin: '0px 0px 22% 0px',
    threshold: 0.01,
    once: true,
  });
  const visible = reducedMotion || inView;

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
        transitionProperty: 'opacity, transform',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
