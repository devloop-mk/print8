'use client';

import { useTranslations } from 'next-intl';
import {
  getColorSwatchDisplayHex,
  getProductColorLabelKey,
  isLightColorSwatch,
} from '@/lib/products/product-color-labels';
import { normalizeHex } from '@/lib/products/design-overlay';
import { cn } from '@/lib/utils';

function colorsMatch(a: string, b: string) {
  return normalizeHex(a) === normalizeHex(b);
}

export function DesignColorPicker({
  colors,
  value,
  onChange,
  className,
  variant = 'default',
  label,
}: {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  className?: string;
  variant?: 'default' | 'compact';
  /** Overrides the default “select color” heading (default variant only). */
  label?: string;
}) {
  const t = useTranslations('products');
  const tColors = useTranslations('products.productColors');

  if (colors.length <= 1) return null;

  const compact = variant === 'compact';

  function colorLabel(hex: string) {
    const key = getProductColorLabelKey(hex);
    return key ? tColors(key) : hex;
  }

  return (
    <div
      className={cn(compact ? 'flex items-center gap-1.5' : undefined, className)}
    >
      {!compact ? (
        <p className="mb-2 text-xs font-medium text-ink-600">
          {label ?? t('customizer.selectColor')}
        </p>
      ) : null}
      <div className={cn('flex flex-wrap', compact ? 'gap-1.5' : 'gap-3')}>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'flex flex-col items-center gap-1.5 transition',
              compact ? 'min-w-0' : 'min-w-[4.5rem]',
            )}
            aria-label={colorLabel(color)}
            aria-pressed={colorsMatch(value, color)}
          >
            <span
              className={cn(
                'rounded-full border-2',
                compact ? 'h-6 w-6' : 'h-9 w-9',
                colorsMatch(value, color)
                  ? compact
                    ? 'border-brand-600 ring-1 ring-brand-200'
                    : 'border-brand-600 ring-2 ring-brand-200'
                  : isLightColorSwatch(color)
                    ? 'border-ink-300 hover:border-ink-400'
                    : 'border-ink-200 hover:border-ink-300',
              )}
              style={{ backgroundColor: getColorSwatchDisplayHex(color) }}
            />
            {!compact ? (
              <span className="max-w-[5rem] text-center text-[11px] font-medium leading-tight text-ink-600">
                {colorLabel(color)}
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
