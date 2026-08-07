'use client';

import { useEffect, useState } from 'react';
import { Box, Rotate3d } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ProductType } from '@/lib/data/catalog';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { Drinkware3DScene } from '@/components/products/customizer/Drinkware3DScene';
import { useDrinkwareWrapTexture } from '@/hooks/useDrinkwareWrapTexture';
import type { DrinkwareImageLayer } from '@/lib/products/build-drinkware-wrap-texture';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import type { PlacedSticker } from '@/lib/products/sticker-library';
import type { PrintAreaInsets } from '@/lib/products/print-area';
import { DRINKWARE_FLAT_CANVAS_HEIGHT_PX } from '@/lib/products/drinkware-3d-config';

export type DrinkwarePreviewMode = 'flat' | '3d';

/** `floating` = fixed-size card used by the mobile/tablet flat↔3D toggle.
 *  `stacked` = full-width below the flat unwrap on mobile.
 *  `pane` = fills its parent (the desktop side-by-side preview column). */
export type DrinkwarePreviewVariant = 'floating' | 'stacked' | 'pane';

type Drinkware3DPreviewProps = {
  productType: ProductType;
  productId?: string;
  productColor: string;
  printBounds: PrintAreaInsets;
  images: DrinkwareImageLayer[];
  textLayers?: PlacedTextLayer[];
  stickers?: PlacedSticker[];
  variant?: DrinkwarePreviewVariant;
  className?: string;
  /** Flat editor canvas height — keeps text scale matched in the wrap texture. */
  canvasHeightPx?: number;
};

export function Drinkware3DPreview({
  productType,
  productId,
  productColor,
  printBounds,
  images,
  textLayers = [],
  stickers = [],
  variant = 'floating',
  className,
  canvasHeightPx,
}: Drinkware3DPreviewProps) {
  const t = useTranslations('products.customizer');
  const [rotateActive, setRotateActive] = useState(false);
  const isStacked = variant === 'stacked';
  const interactive = !isStacked || rotateActive;

  useEffect(() => {
    setRotateActive(false);
  }, [productId, variant]);

  const { textureCanvas, loading } = useDrinkwareWrapTexture({
    productType,
    productId,
    productColor,
    printBounds,
    images,
    textLayers,
    stickers,
    canvasHeightPx: canvasHeightPx ?? DRINKWARE_FLAT_CANVAS_HEIGHT_PX,
  });

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[#eef2f6]',
        variant === 'pane'
          ? 'h-full w-full'
          : variant === 'stacked'
            ? 'aspect-[4/5] w-[min(85vw,20rem)] rounded-sm shadow-[0_8px_40px_rgba(15,23,42,0.12)]'
            : 'aspect-[4/5] w-[min(18rem,78vw)] rounded-sm shadow-[0_8px_40px_rgba(15,23,42,0.12)] md:w-[min(28rem,46vh)] lg:w-[min(32rem,52vh)] xl:w-[min(36rem,58vh)]',
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
        productId={productId}
        productColor={productColor}
        textureCanvas={textureCanvas}
        interactive={interactive}
        idleAutoRotate={isStacked && !rotateActive && Boolean(textureCanvas)}
      />
      {isStacked ? (
        <>
          {rotateActive ? (
            <>
              <button
                type="button"
                onClick={() => setRotateActive(false)}
                className="absolute right-2 top-2 z-20 rounded-md border border-ink-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink-700 shadow-sm backdrop-blur-sm"
              >
                {t('preview3dRotateDone')}
              </button>
              <p className="pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center text-[10px] font-medium text-ink-500/90">
                {t('preview3dMobileDragHint')}
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setRotateActive(true)}
              className="absolute inset-x-3 bottom-3 z-20 inline-flex items-center justify-center gap-1.5 rounded-md border border-ink-200 bg-white/95 px-3 py-2 text-[11px] font-semibold text-ink-700 shadow-sm backdrop-blur-sm"
            >
              <Rotate3d className="h-3.5 w-3.5" aria-hidden />
              {t('preview3dTapToRotate')}
            </button>
          )}
        </>
      ) : (
        <p className="pointer-events-none absolute inset-x-0 bottom-2 z-10 text-center text-[10px] font-medium text-ink-500/90">
          {t('preview3dDragHint')}
        </p>
      )}
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
