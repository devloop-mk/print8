'use client';

import { useId, useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterOption<T extends string> = {
  value: T;
  label: string;
};

type FilterChipBarProps<T extends string> = {
  options: FilterOption<T>[];
  allOption: FilterOption<T>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  showFiltersLabel: string;
  hideFiltersLabel: string;
  resultsCount?: number;
  resultsLabel?: (count: number) => string;
};

export function FilterChipBar<T extends string>({
  options,
  allOption,
  value,
  onChange,
  ariaLabel,
  showFiltersLabel,
  hideFiltersLabel,
  resultsCount,
  resultsLabel,
}: FilterChipBarProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const allOptions = [allOption, ...options];
  const activeOption =
    allOptions.find((option) => option.value === value) ?? allOption;
  const hasActiveFilter = value !== allOption.value;

  function select(next: T) {
    onChange(next);
    if (window.matchMedia('(max-width: 767px)').matches) {
      setExpanded(false);
    }
  }

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 md:border-b-0 md:pb-0 md:pt-4">
        <div className="hidden items-center gap-2 text-sm font-semibold text-ink-900 md:flex">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" aria-hidden />
          {ariaLabel}
        </div>

        <button
          type="button"
          className="flex flex-1 items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-left text-sm font-medium text-ink-800 transition hover:border-brand-200 hover:bg-brand-50/50 md:hidden"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="truncate">{expanded ? hideFiltersLabel : showFiltersLabel}</span>
          {hasActiveFilter ? (
            <span className="truncate rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {activeOption.label}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              'ml-auto h-4 w-4 shrink-0 text-ink-400 transition-transform duration-300',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        {typeof resultsCount === 'number' && resultsLabel ? (
          <p className="hidden text-sm text-ink-500 md:block">
            {resultsLabel(resultsCount)}
          </p>
        ) : null}
      </div>

      <div
        id={panelId}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out md:grid-rows-[1fr] md:opacity-100',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 md:opacity-100',
        )}
      >
        <div className="overflow-hidden">
          <div
            className="flex flex-wrap gap-2 px-4 pb-4 pt-1 md:pt-3"
            role="tablist"
            aria-label={ariaLabel}
          >
            {allOptions.map((option) => {
              const selected = value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => select(option.value)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition',
                    selected
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {typeof resultsCount === 'number' && resultsLabel ? (
            <p className="border-t border-ink-100 px-4 py-2.5 text-xs text-ink-500 md:hidden">
              {resultsLabel(resultsCount)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
