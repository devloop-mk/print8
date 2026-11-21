import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';

export function PromoCatalogSheet({
  children,
  pageNumber,
  category,
  variant = 'inner',
  className,
}: {
  children: ReactNode;
  pageNumber?: number;
  category?: string;
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
        <div className="flex h-[3.55%] items-center justify-between gap-[3%] bg-brand-600 px-[4%]">
          {category ? (
            <span className="min-w-0 truncate font-display text-[1.38cqw] font-semibold uppercase tracking-[0.14em] text-white">
              {category}
            </span>
          ) : (
            <span />
          )}
          <Logo className="h-[78%] w-auto shrink-0 brightness-0 invert" />
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">{children}</div>

      {variant !== 'cover' ? (
        <div className="flex h-[3.55%] items-center justify-end bg-brand-600 px-[4%]">
          {pageNumber ? (
            <span className="font-display text-[1.38cqw] font-semibold tracking-wide text-white">
              {pageNumber}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
