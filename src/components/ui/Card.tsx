import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-ink-200 bg-white p-6 shadow-sm transition hover:shadow-md',
      className,
    )}
    {...props}
  >
    {children}
  </div>
));

Card.displayName = 'Card';
