'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type QuantityInputProps = {
  id?: string;
  name?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
};

export function QuantityInput({
  id,
  name,
  value,
  onChange,
  min = 1,
  max = 999,
  className,
}: QuantityInputProps) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(String(value));
    }
  }, [focused, value]);

  return (
    <input
      id={id}
      name={name}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={focused ? draft : value}
      onFocus={() => {
        setDraft(String(value));
        setFocused(true);
      }}
      onChange={(event) => {
        const nextDraft = event.target.value;
        setDraft(nextDraft);
        if (nextDraft === '') return;
        const parsed = parseInt(nextDraft, 10);
        if (!Number.isFinite(parsed)) return;
        onChange(Math.min(max, Math.max(min, parsed)));
      }}
      onBlur={() => {
        const parsed = parseInt(draft, 10);
        const next = Math.min(
          max,
          Math.max(min, Number.isFinite(parsed) ? parsed : min),
        );
        onChange(next);
        setDraft(String(next));
        setFocused(false);
      }}
      className={cn(
        'rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
        className,
      )}
    />
  );
}
