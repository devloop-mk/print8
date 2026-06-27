'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
};

export function DesignCustomizerMobileFieldBar({
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
}: DesignCustomizerMobileFieldBarProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open, inputId]);

  if (!open) return null;

  const inputClassName = cn(
    'w-full rounded-lg border border-brand-300 bg-white px-3 py-2.5 text-base text-ink-900',
    'placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
  );

  return (
    <>
      <div
        className="md:hidden"
        style={{ height: 'calc(7.5rem + env(safe-area-inset-bottom, 0px))' }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 shadow-[0_-10px_40px_rgba(15,23,42,0.12)] backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto max-w-7xl px-4 pt-3">
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-brand-700">
            {label}
          </label>
          {multiline ? (
            <textarea
              id={inputId}
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              rows={2}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={cn(inputClassName, 'resize-none')}
            />
          ) : (
            <input
              id={inputId}
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
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
}
