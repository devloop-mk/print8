'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function DesignColorPicker({
  colors,
  value,
  onChange,
  className,
  variant = 'default',
}: {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  className?: string;
  variant?: 'default' | 'compact';
}) {
  const t = useTranslations('products');

  if (colors.length <= 1) return null;

  const compact = variant === 'compact';

  return (
    <div
      className={cn(
        compact ? 'flex items-center gap-1.5' : undefined,
        className,
      )}
    >
      {!compact ? (
        <p className="mb-2 text-xs font-medium text-ink-600">
          {t('customizer.selectColor')}
        </p>
      ) : null}
      <div className={cn('flex flex-wrap', compact ? 'gap-1.5' : 'gap-2')}>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'rounded-full border-2 transition',
              compact ? 'h-6 w-6' : 'h-9 w-9',
              value === color
                ? compact
                  ? 'border-brand-600 ring-1 ring-brand-200'
                  : 'border-brand-600 ring-2 ring-brand-200'
                : 'border-ink-200 hover:border-ink-300',
            )}
            style={{ backgroundColor: color }}
            aria-label={color}
            aria-pressed={value === color}
          />
        ))}
      </div>
    </div>
  );
}
