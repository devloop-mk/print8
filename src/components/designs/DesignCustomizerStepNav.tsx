'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type DesignCustomizerStepNavProps<T extends string> = {
  steps: T[];
  step: T;
  stepIndex: number;
  stepIcons: Record<T, LucideIcon>;
  onStepChange: (step: T) => void;
  label: (step: T) => string;
  hint?: (step: T) => string;
  ariaLabel: string;
};

export function DesignCustomizerStepNav<T extends string>({
  steps,
  step,
  stepIndex,
  stepIcons,
  onStepChange,
  label,
  hint,
  ariaLabel,
}: DesignCustomizerStepNavProps<T>) {
  return (
    <nav aria-label={ariaLabel} className="w-full min-w-0 max-w-full">
      <ol
        className={cn(
          'grid w-full min-w-0 max-w-full gap-2',
          steps.length >= 5
            ? 'grid-cols-2 md:grid-cols-5'
            : steps.length === 4
              ? 'grid-cols-2 md:grid-cols-4'
              : 'grid-cols-3 md:grid-cols-3',
        )}
      >
        {steps.map((item, index) => {
          const Icon = stepIcons[item] as LucideIcon;
          const isActive = step === item;
          const isDone = index < stepIndex;

          return (
            <li key={item} className="min-w-0">
              <button
                type="button"
                onClick={() => onStepChange(item)}
                className={cn(
                  'flex h-full w-full min-w-0 items-center rounded-xl border text-left transition',
                  isActive
                    ? 'gap-2 border-brand-500 bg-brand-50 px-2.5 py-2 shadow-sm sm:gap-3 sm:px-3 sm:py-2.5 md:py-3'
                    : 'gap-1.5 border-ink-200 px-2 py-2 sm:gap-2 sm:px-2.5 md:gap-3 md:px-3 md:py-3',
                  !isActive && isDone && 'bg-white hover:border-brand-300',
                  !isActive && !isDone && 'bg-ink-50/60 hover:border-ink-300',
                )}
              >
                <span
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-full font-bold',
                    isActive
                      ? 'h-6 w-6 bg-brand-600 text-[11px] text-white sm:h-7 sm:w-7 sm:text-xs md:h-8 md:w-8 md:text-sm'
                      : isDone
                        ? 'h-6 w-6 bg-brand-100 text-[10px] text-brand-700 sm:text-[11px] md:h-8 md:w-8 md:text-sm'
                        : 'h-6 w-6 bg-ink-200 text-[10px] text-ink-600 sm:text-[11px] md:h-8 md:w-8 md:text-sm',
                  )}
                >
                  {index + 1}
                </span>
                <Icon
                  className={cn(
                    'shrink-0 text-brand-600',
                    isActive ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4',
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate font-semibold text-ink-900',
                      isActive ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs md:text-sm',
                    )}
                  >
                    {label(item)}
                  </span>
                  {hint ? (
                    <span className="hidden truncate text-xs text-ink-500 md:block">{hint(item)}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
