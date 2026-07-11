'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

type BrandingPackQuantityInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  max?: number;
};

export function BrandingPackQuantityInput({
  value,
  onChange,
  disabled = false,
  max,
}: BrandingPackQuantityInputProps) {
  const t = useTranslations('products.brandingPack');
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  function applyValue(next: number) {
    const clamped =
      max !== undefined ? Math.min(Math.max(0, next), max) : Math.max(0, next);
    onChange(clamped);
    setText(String(clamped));
  }

  function commitText(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (digits === '') {
      applyValue(0);
      return;
    }
    applyValue(parseInt(digits, 10));
  }

  const increaseDisabled = disabled || (max !== undefined && value >= max);

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={disabled || value <= 0}
        onClick={() => applyValue(value - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 disabled:opacity-40"
        aria-label={t('decreaseQty')}
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        disabled={disabled}
        value={text}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '');
          setText(raw);
          if (raw !== '') {
            applyValue(parseInt(raw, 10));
          }
        }}
        onBlur={() => commitText(text)}
        className="h-8 w-14 rounded-lg border border-ink-200 bg-white text-center text-sm font-semibold tabular-nums text-ink-900 disabled:opacity-50"
        aria-label={t('quantity')}
      />
      <button
        type="button"
        disabled={increaseDisabled}
        onClick={() => applyValue(value + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 disabled:opacity-40"
        aria-label={t('increaseQty')}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
