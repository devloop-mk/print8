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
    <div className={cn('mb-10 sm:mb-12', className)}>
      <div className={cn(centered && 'text-center')}>
        <h1 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              'mt-3 max-w-3xl text-lg leading-relaxed text-ink-600 sm:mt-4',
              centered && 'mx-auto',
            )}
          >
            {subtitle}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
