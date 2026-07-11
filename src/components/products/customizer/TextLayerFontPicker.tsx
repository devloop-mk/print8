'use client';

import { useTranslations } from 'next-intl';
import { CUSTOMIZER_FONTS, type CustomizerFontId } from '@/lib/products/customizer-fonts';
import { cn } from '@/lib/utils';

export function TextLayerFontPicker({
  value,
  onChange,
}: {
  value: CustomizerFontId;
  onChange: (fontId: CustomizerFontId) => void;
}) {
  const t = useTranslations('products.customizer');

  return (
    <div className="space-y-2">
      <span className="text-sm text-ink-600">{t('textFont')}</span>
      <div className="grid grid-cols-2 gap-2">
        {CUSTOMIZER_FONTS.map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => onChange(font.id)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-left text-sm transition',
              value === font.id
                ? 'border-brand-400 bg-brand-50 text-brand-800 ring-1 ring-brand-200'
                : 'border-ink-200 bg-white text-ink-800 hover:border-brand-200 hover:bg-brand-50/40',
            )}
            style={{ fontFamily: font.family }}
          >
            {font.label}
          </button>
        ))}
      </div>
    </div>
  );
}
