'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export function DesignColorPicker({
  colors,
  value,
  onChange,
  className,
}: {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  className?: string;
}) {
  const t = useTranslations('products');

  if (colors.length <= 1) return null;

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-ink-600">
        {t('customizer.selectColor')}
      </p>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'h-9 w-9 rounded-full border-2 transition',
              value === color
                ? 'border-brand-600 ring-2 ring-brand-200'
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
