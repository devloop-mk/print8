import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

export function PromoCatalogSheet({
  children,
  pageNumber,
  variant = 'inner',
  className,
}: {
  children: ReactNode;
  pageNumber?: number;
  variant?: 'cover' | 'inner' | 'back';
  className?: string;
}) {
  return (
    <article
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden bg-white text-ink-900 [container-type:size]',
        className,
      )}
    >
      {variant !== 'cover' ? (
        <div className="flex h-[2.55%] items-center justify-end bg-brand-600 px-[4%]">
          <Logo className="h-[62%] w-auto brightness-0 invert" />
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">{children}</div>

      {variant !== 'cover' ? (
        <div className="flex h-[2.7%] items-center justify-end bg-brand-600 px-[4%]">
          {pageNumber ? (
            <span className="font-display text-[1.05cqw] font-semibold tracking-wide text-white">
              {pageNumber}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
