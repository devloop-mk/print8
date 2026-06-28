'use client';

import { useId, useState } from 'react';
import { ChevronDown, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
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
  /** Mobile: horizontal icon strip (best with icons). Default: collapsible panel. */
  mobileLayout?: 'collapse' | 'scroll';
};

function FilterChip<T extends string>({
  option,
  selected,
  onSelect,
  layout,
}: {
  option: FilterOption<T>;
  selected: boolean;
  onSelect: () => void;
  layout: 'scroll' | 'chip';
}) {
  const Icon = option.icon;

  if (layout === 'scroll') {
    return (
      <button
        type="button"
        role="tab"
        aria-selected={selected}
        onClick={onSelect}
        className={cn(
          'flex w-[5.25rem] shrink-0 snap-start flex-col items-center gap-2 border-2 px-2 py-3 transition',
          selected
            ? 'border-brand-700 bg-brand-600 text-white shadow-lift-brand'
            : 'border-ink-200 bg-ink-50 text-ink-600 hover:border-brand-300 hover:bg-brand-50',
        )}
      >
        {Icon ? (
          <span
            className={cn(
              'flex h-9 w-9 items-center justify-center border',
              selected
                ? 'border-white/30 bg-white/15 text-white'
                : 'border-brand-200 bg-white text-brand-700',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
        <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight">
          {option.label}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        'inline-flex items-center gap-2 border-2 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition',
        selected
          ? 'border-brand-800 bg-brand-600 text-white shadow-lift-brand'
          : 'border-ink-200 bg-ink-50 text-ink-600 hover:border-brand-300 hover:bg-brand-50',
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
      <span>{option.label}</span>
    </button>
  );
}

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
  mobileLayout = 'collapse',
}: FilterChipBarProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const useScrollMobile = mobileLayout === 'scroll';

  const allOptions = [allOption, ...options];
  const activeOption =
    allOptions.find((option) => option.value === value) ?? allOption;
  const hasActiveFilter = value !== allOption.value;
  const ActiveIcon = activeOption.icon;

  function select(next: T) {
    onChange(next);
    if (!useScrollMobile && window.matchMedia('(max-width: 767px)').matches) {
      setExpanded(false);
    }
  }

  const resultsText =
    typeof resultsCount === 'number' && resultsLabel
      ? resultsLabel(resultsCount)
      : null;

  if (useScrollMobile) {
    return (
      <div className="mb-8 w-full min-w-0 max-w-full overflow-hidden border border-ink-200 bg-white shadow-lift">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-ink-100 px-4 py-3 md:px-4 md:py-4">
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink-900">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <span className="truncate">{ariaLabel}</span>
          </div>
          {resultsText ? (
            <p className="shrink-0 text-xs text-ink-500 md:text-sm">{resultsText}</p>
          ) : null}
        </div>

        <div
          className={cn(
            'flex w-full min-w-0 max-w-full gap-2 overflow-x-auto px-4 py-3 [contain:inline-size] md:hidden',
            'snap-x snap-mandatory scroll-smooth',
            '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          )}
          role="tablist"
          aria-label={ariaLabel}
        >
          {allOptions.map((option) => (
            <FilterChip
              key={option.value}
              option={option}
              selected={value === option.value}
              onSelect={() => select(option.value)}
              layout="scroll"
            />
          ))}
        </div>

        <div
          className="hidden flex-wrap gap-2 px-4 pb-4 pt-1 md:flex md:pt-3"
          role="tablist"
          aria-label={ariaLabel}
        >
          {allOptions.map((option) => (
            <FilterChip
              key={option.value}
              option={option}
              selected={value === option.value}
              onSelect={() => select(option.value)}
              layout="chip"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 w-full min-w-0 max-w-full overflow-hidden border border-ink-200 bg-white shadow-lift">
      <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 md:border-b-0 md:pb-0 md:pt-4">
        <div className="hidden items-center gap-2 text-sm font-semibold text-ink-900 md:flex">
          <SlidersHorizontal className="h-4 w-4 text-brand-600" aria-hidden />
          {ariaLabel}
        </div>

        <button
          type="button"
          className="flex flex-1 items-center gap-2 border-2 border-ink-200 bg-ink-50 px-3 py-2.5 text-left text-sm font-medium text-ink-800 transition hover:border-brand-400 hover:bg-brand-50/50 md:hidden"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="truncate">{expanded ? hideFiltersLabel : showFiltersLabel}</span>
          {hasActiveFilter ? (
            <span className="inline-flex max-w-[45%] items-center gap-1.5 truncate badge-brand bg-brand-100">
              {ActiveIcon ? (
                <ActiveIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : null}
              <span className="truncate">{activeOption.label}</span>
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

        {resultsText ? (
          <p className="hidden text-sm text-ink-500 md:block">{resultsText}</p>
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
            {allOptions.map((option) => (
              <FilterChip
                key={option.value}
                option={option}
                selected={value === option.value}
                onSelect={() => select(option.value)}
                layout="chip"
              />
            ))}
          </div>

          {resultsText ? (
            <p className="border-t border-ink-100 px-4 py-2.5 text-xs text-ink-500 md:hidden">
              {resultsText}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
