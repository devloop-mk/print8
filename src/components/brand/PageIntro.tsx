import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageIntroProps = {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
  children?: ReactNode;
};

export function PageIntro({
  title,
  subtitle,
  centered = false,
  className,
  children,
}: PageIntroProps) {
  return (
    <div className={cn('mb-12', className)}>
      <div className={cn(centered && 'text-center')}>
        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{title}</h1>
        {subtitle ? (
          <p className={cn('mt-2 text-lg text-ink-500', centered && 'mt-4')}>
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
