'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type DesignCustomizerMobileFieldBarHandle = {
  focus: () => void;
};

type DesignCustomizerMobileFieldBarProps = {
  open: boolean;
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputId: string;
  onPrev?: () => void;
  onNext?: () => void;
  prevDisabled?: boolean;
  nextDisabled?: boolean;
  prevLabel: string;
  nextLabel: string;
  multiline?: boolean;
  placeholder?: string;
  doneLabel?: string;
};

export const DesignCustomizerMobileFieldBar = forwardRef<
  DesignCustomizerMobileFieldBarHandle,
  DesignCustomizerMobileFieldBarProps
>(function DesignCustomizerMobileFieldBar(
  {
    open,
    label,
    value,
    onChange,
    inputId,
    onPrev,
    onNext,
    prevDisabled,
    nextDisabled,
    prevLabel,
    nextLabel,
    multiline = false,
    placeholder,
    doneLabel = 'Done',
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      const node = inputRef.current;
      if (!node) return;
      node.focus({ preventScroll: true });
      try {
        const length = node.value.length;
        node.setSelectionRange(length, length);
      } catch {
        // textarea/input selection not always supported
      }
    },
  }));

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 60);
    return () => window.clearTimeout(timer);
  }, [open, inputId]);

  if (!open) return null;

  const inputClassName = cn(
    'w-full rounded-lg border border-brand-300 bg-white px-3 py-3 text-base text-ink-900',
    'placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
  );

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter' && !multiline && onNext && !nextDisabled) {
      event.preventDefault();
      onNext();
    }
  }

  return (
    <>
      <div
        className="md:hidden"
        style={{ height: 'calc(8.5rem + env(safe-area-inset-bottom, 0px))' }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-200 bg-white shadow-[0_-12px_40px_rgba(15,23,42,0.14)] md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto max-w-7xl px-4 pt-3">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              {label}
            </label>
            <button
              type="button"
              className="text-sm font-semibold text-brand-600"
              onClick={() => inputRef.current?.blur()}
            >
              {doneLabel}
            </button>
          </div>
          {multiline ? (
            <textarea
              id={inputId}
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              rows={2}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
              autoCorrect="on"
              spellCheck
              className={cn(inputClassName, 'resize-none')}
            />
          ) : (
            <input
              id={inputId}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              inputMode="text"
              enterKeyHint={onNext && !nextDisabled ? 'next' : 'done'}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoComplete="off"
              autoCorrect="on"
              spellCheck
              className={inputClassName}
            />
          )}
          {onPrev || onNext ? (
            <div className="mt-2 flex gap-2">
              {onPrev ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={prevDisabled}
                  onClick={onPrev}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {prevLabel}
                </Button>
              ) : null}
              {onNext ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={nextDisabled}
                  onClick={onNext}
                >
                  {nextLabel}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
});
