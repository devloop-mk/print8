'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { CatalogSearchField } from '@/components/catalog/CatalogSearchField';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  getColorSwatchDisplayHex,
  isLightColorSwatch,
} from '@/lib/products/product-color-labels';
import { cn } from '@/lib/utils';

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

type BaseGroup = {
  id: string;
  title: string;
};

export type FilterOptionGroup<T extends string = string> = BaseGroup & {
  kind: 'options';
  allOption: FilterOption<T>;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** When false, the all option is omitted (e.g. navigation-only groups). Default true. */
  includeAllOption?: boolean;
};

export type ColorFilterGroup = BaseGroup & {
  kind: 'colors';
  colors: string[];
  value: string | 'all';
  onChange: (value: string | 'all') => void;
  allLabel: string;
};

export type PillFilterGroup<T extends string = string> = BaseGroup & {
  kind: 'pills';
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export type CatalogFilterGroup =
  | FilterOptionGroup
  | ColorFilterGroup
  | PillFilterGroup;

type CatalogFilterLayoutProps = {
  groups: CatalogFilterGroup[];
  ariaLabel: string;
  showFiltersLabel: string;
  hideFiltersLabel: string;
  resultsCount?: number;
  resultsLabel?: (count: number) => string;
  searchQuery?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  searchClearLabel?: string;
  onSearchChange?: (value: string) => void;
  children: ReactNode;
};

function SidebarOptionButton({
  label,
  selected,
  icon: Icon,
  onSelect,
}: {
  label: string;
  selected: boolean;
  icon?: LucideIcon;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition',
        selected
          ? 'bg-brand-600 text-white shadow-sm'
          : 'text-ink-700 hover:bg-ink-50 hover:text-brand-700',
      )}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
    </button>
  );
}

function FilterGroupPanel({
  group,
  onSelect,
}: {
  group: CatalogFilterGroup;
  onSelect?: () => void;
}) {
  if (group.kind === 'options') {
    const allOptions = group.includeAllOption === false
      ? group.options
      : [group.allOption, ...group.options];

    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          {group.title}
        </p>
        <div className="space-y-1" role="tablist" aria-label={group.title}>
          {allOptions.map((option) => (
            <SidebarOptionButton
              key={option.value}
              label={option.label}
              icon={option.icon}
              selected={group.value === option.value}
              onSelect={() => {
                group.onChange(option.value);
                onSelect?.();
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (group.kind === 'colors') {
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          {group.title}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              group.onChange('all');
              onSelect?.();
            }}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              group.value === 'all'
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
            )}
          >
            {group.allLabel}
          </button>
          {group.colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                group.onChange(color);
                onSelect?.();
              }}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition',
                group.value === color
                  ? 'border-brand-600 ring-2 ring-brand-200'
                  : isLightColorSwatch(color)
                    ? 'border-ink-300 hover:border-ink-400'
                    : 'border-ink-200 hover:border-ink-300',
              )}
              style={{ backgroundColor: getColorSwatchDisplayHex(color) }}
              aria-label={color}
              title={color}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
        {group.title}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {group.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              group.onChange(option.value);
              onSelect?.();
            }}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              group.value === option.value
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MobileFilterPanel({
  groups,
  ariaLabel,
  showFiltersLabel,
  hideFiltersLabel,
  resultsLabel,
  resultsCount,
  searchDraft,
  searchPlaceholder,
  searchAriaLabel,
  searchClearLabel,
  onSearchDraftChange,
  onFilterSelect,
}: {
  groups: CatalogFilterGroup[];
  ariaLabel: string;
  showFiltersLabel: string;
  hideFiltersLabel: string;
  resultsLabel?: (count: number) => string;
  resultsCount?: number;
  searchDraft?: string;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  searchClearLabel?: string;
  onSearchDraftChange?: (value: string) => void;
  onFilterSelect?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();

  const activeCount = groups.reduce((count, group) => {
    if (group.kind === 'options') {
      if (group.includeAllOption === false) return count;
      return count + (group.value !== group.allOption.value ? 1 : 0);
    }
    if (group.kind === 'colors') {
      return count + (group.value !== 'all' ? 1 : 0);
    }
    const first = group.options[0];
    return count + (first && group.value !== first.value ? 1 : 0);
  }, 0);

  const resultsText =
    typeof resultsCount === 'number' && resultsLabel
      ? resultsLabel(resultsCount)
      : null;

  const showSearch = Boolean(
    onSearchDraftChange && searchPlaceholder && searchAriaLabel && searchClearLabel,
  );

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden border border-ink-200 bg-white shadow-lift">
      {showSearch ? (
        <div className="border-b border-ink-100 px-4 py-3">
          <CatalogSearchField
            value={searchDraft ?? ''}
            onChange={onSearchDraftChange!}
            placeholder={searchPlaceholder!}
            ariaLabel={searchAriaLabel!}
            clearLabel={searchClearLabel!}
          />
        </div>
      ) : null}
      <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 border-2 border-ink-200 bg-ink-50 px-3 py-2.5 text-left text-sm font-medium text-ink-800 transition hover:border-brand-400 hover:bg-brand-50/50"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((open) => !open)}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="truncate">
            {expanded ? hideFiltersLabel : showFiltersLabel}
          </span>
          {activeCount > 0 ? (
            <span className="badge-brand ml-1 shrink-0 bg-brand-100">
              {activeCount}
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
      </div>

      <div
        id={panelId}
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-300 ease-out',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div
            className="space-y-5 px-4 py-4"
            role="region"
            aria-label={ariaLabel}
          >
            {groups.map((group) => (
              <FilterGroupPanel
                key={group.id}
                group={group}
                onSelect={() => {
                  setExpanded(false);
                  onFilterSelect?.();
                }}
              />
            ))}
          </div>

          {resultsText ? (
            <p className="border-t border-ink-100 px-4 py-2.5 text-xs text-ink-500">
              {resultsText}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CatalogFilterLayout({
  groups,
  ariaLabel,
  showFiltersLabel,
  hideFiltersLabel,
  resultsCount,
  resultsLabel,
  searchQuery,
  searchPlaceholder,
  searchAriaLabel,
  searchClearLabel,
  onSearchChange,
  children,
}: CatalogFilterLayoutProps) {
  const resultsRef = useRef<HTMLDivElement>(null);

  // Single owner of the search draft + debounce for both the desktop sidebar and the
  // mobile panel fields below. They are both rendered as plain controlled inputs bound
  // to this one piece of state — neither owns its own debounce effect — so there is
  // exactly one effect anywhere that can ever call onSearchChange.
  const [draft, setDraft] = useState(searchQuery ?? '');
  const debouncedDraft = useDebouncedValue(draft, 300);
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;

  // Sync external query changes (e.g. cleared elsewhere) without clobbering in-progress typing.
  useEffect(() => {
    const external = searchQuery ?? '';
    setDraft((current) => (current === external ? current : external));
  }, [searchQuery]);

  useEffect(() => {
    const external = searchQuery ?? '';
    if (debouncedDraft === external) return;
    onSearchChangeRef.current?.(debouncedDraft);
  }, [debouncedDraft, searchQuery]);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  const resultsText =
    typeof resultsCount === 'number' && resultsLabel
      ? resultsLabel(resultsCount)
      : null;

  const showSearch = Boolean(
    onSearchChange && searchPlaceholder && searchAriaLabel && searchClearLabel,
  );

  if (groups.length === 0 && !showSearch) {
    return <>{children}</>;
  }

  return (
    <div className="min-w-0 lg:grid lg:grid-cols-[minmax(0,15rem)_1fr] lg:gap-8 xl:grid-cols-[minmax(0,16rem)_1fr]">
      <aside className="hidden lg:sticky lg:top-20 lg:z-20 lg:block lg:self-start">
        <div className="max-h-[calc(100vh-5.5rem)] space-y-6 overflow-y-auto overscroll-contain border border-ink-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-ink-100 pb-3 text-sm font-semibold text-ink-900">
            <SlidersHorizontal className="h-4 w-4 text-brand-600" aria-hidden />
            {ariaLabel}
          </div>

          {showSearch ? (
            <CatalogSearchField
              value={draft}
              onChange={setDraft}
              placeholder={searchPlaceholder!}
              ariaLabel={searchAriaLabel!}
              clearLabel={searchClearLabel!}
            />
          ) : null}

          {groups.map((group) => (
            <FilterGroupPanel
              key={group.id}
              group={group}
              onSelect={scrollToResults}
            />
          ))}

          {resultsText ? (
            <p className="border-t border-ink-100 pt-3 text-xs text-ink-500">
              {resultsText}
            </p>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-6 lg:hidden">
          <MobileFilterPanel
            groups={groups}
            ariaLabel={ariaLabel}
            showFiltersLabel={showFiltersLabel}
            hideFiltersLabel={hideFiltersLabel}
            resultsCount={resultsCount}
            resultsLabel={resultsLabel}
            searchDraft={draft}
            searchPlaceholder={searchPlaceholder}
            searchAriaLabel={searchAriaLabel}
            searchClearLabel={searchClearLabel}
            onSearchDraftChange={setDraft}
            onFilterSelect={scrollToResults}
          />
        </div>
        <div ref={resultsRef} className="scroll-mt-24">
          {children}
        </div>
      </div>
    </div>
  );
}
