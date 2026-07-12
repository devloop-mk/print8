'use client';

import { Box, Rotate3d } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ProductType } from '@/lib/data/catalog';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Drinkware3DScene } from '@/components/products/customizer/Drinkware3DScene';
import { useDrinkwareWrapTexture } from '@/hooks/useDrinkwareWrapTexture';
import type { DrinkwareImageLayer } from '@/lib/products/build-drinkware-wrap-texture';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import type { PrintAreaInsets } from '@/lib/products/print-area';

export type DrinkwarePreviewMode = 'flat' | '3d';

type Drinkware3DPreviewProps = {
  productType: ProductType;
  productColor: string;
  printBounds: PrintAreaInsets;
  images: DrinkwareImageLayer[];
  textLayers?: PlacedTextLayer[];
  className?: string;
};

export function Drinkware3DPreview({
  productType,
  productColor,
  printBounds,
  images,
  textLayers = [],
  className,
}: Drinkware3DPreviewProps) {
  const t = useTranslations('products.customizer');
  const { textureCanvas, loading } = useDrinkwareWrapTexture({
    productType,
    productColor,
    printBounds,
    images,
    textLayers,
  });

  return (
    <div
      className={cn(
        'relative aspect-[3/4] w-[min(18rem,78vw)] overflow-hidden rounded-sm bg-[#eef2f6] shadow-[0_8px_40px_rgba(15,23,42,0.12)] md:w-[min(28rem,46vh)] lg:w-[min(32rem,52vh)] xl:w-[min(36rem,58vh)]',
        className,
      )}
    >
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#eef2f6]/80 backdrop-blur-sm">
          <LoadingIndicator label={t('preview3dLoading')} size="sm" />
        </div>
      ) : null}
      <Drinkware3DScene
        productType={productType}
        productColor={productColor}
        textureCanvas={textureCanvas}
      />
      <p className="pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center text-[10px] font-medium text-ink-500/90">
        {t('preview3dDragHint')}
      </p>
    </div>
  );
}

type DrinkwarePreviewModeToggleProps = {
  mode: DrinkwarePreviewMode;
  onChange: (mode: DrinkwarePreviewMode) => void;
  className?: string;
};

export function DrinkwarePreviewModeToggle({
  mode,
  onChange,
  className,
}: DrinkwarePreviewModeToggleProps) {
  const t = useTranslations('products.customizer');

  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-ink-200 bg-white p-0.5 shadow-sm',
        className,
      )}
      role="tablist"
      aria-label={t('previewModeLabel')}
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'flat'}
        onClick={() => onChange('flat')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
          mode === 'flat'
            ? 'bg-brand-50 text-brand-700'
            : 'text-ink-600 hover:text-ink-900',
        )}
      >
        <Box className="h-3.5 w-3.5" />
        {t('previewModeFlat')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === '3d'}
        onClick={() => onChange('3d')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition',
          mode === '3d'
            ? 'bg-brand-50 text-brand-700'
            : 'text-ink-600 hover:text-ink-900',
        )}
      >
        <Rotate3d className="h-3.5 w-3.5" />
        {t('previewMode3d')}
      </button>
    </div>
  );
}
