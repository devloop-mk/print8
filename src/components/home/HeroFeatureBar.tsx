import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function HeroFeatureBar({
  items,
}: {
  items: Array<{ icon: LucideIcon; label: string }>;
}) {
  return (
    <div className="relative mt-4 w-full border-t border-brand-400/25 bg-gradient-to-b from-brand-900/50 to-brand-950/70 backdrop-blur-md sm:mt-0">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-4 lg:px-8">
        {/* Mobile: 2×2 brand-tinted cards. Desktop: single divided strip. */}
        <div
          className={cn(
            'grid grid-cols-2 gap-x-3 gap-y-4',
            'sm:grid-cols-4 sm:gap-0 sm:overflow-hidden sm:border sm:border-brand-300/20 sm:bg-brand-800/20',
          )}
        >
          {items.map(({ icon: Icon, label }, index) => (
            <div
              key={label}
              className={cn(
                'flex flex-col items-center gap-3 border border-brand-300/30 bg-gradient-to-b from-brand-500/20 via-brand-800/25 to-brand-950/40 px-3 py-5 text-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-sm',
                '[border-radius:10px]',
                'sm:flex-row sm:items-center sm:gap-3 sm:bg-transparent sm:px-5 sm:py-4 sm:text-left sm:shadow-none lg:px-6',
                'sm:[border-radius:0] sm:border-0',
                index < items.length - 1 && 'sm:border-r sm:border-brand-300/20',
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center',
                  'border border-brand-200/40 bg-gradient-to-br from-brand-300/30 to-brand-600/20',
                  'text-brand-50 [border-radius:8px] shadow-[0_2px_8px_rgba(47,124,178,0.25)]',
                  'sm:h-10 sm:w-10 sm:shadow-none',
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
              </div>
              <p className="min-w-0 text-[12px] font-semibold leading-snug tracking-tight text-brand-50 sm:text-sm sm:font-medium sm:text-white/95">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
