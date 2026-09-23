'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Box, Rotate3d } from 'lucide-react';
import type { CartItem } from '@/lib/cart/types';
import type { Product } from '@/lib/data/catalog';
import {
  getCartDrinkwareSideDesign,
  getCartItemColor,
} from '@/lib/cart/product-cart';
import { DrinkwareDesignPreview3D } from '@/components/products/customizer/DrinkwareDesignPreview3D';
import {
  getOverlayPrintBounds,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';
import { cn } from '@/lib/utils';

type PreviewImage = { src: string; label?: string };

export function CartDrinkwarePreview({
  item,
  product,
  previewImages,
  onOpenLightbox,
}: {
  item: CartItem;
  product: Product;
  previewImages: PreviewImage[];
  onOpenLightbox: (index: number) => void;
}) {
  const t = useTranslations('cart');
  const [mode, setMode] = useState<'flat' | '3d'>('flat');
  const sideDesign = useMemo(
    () => getCartDrinkwareSideDesign(item, product),
    [item, product],
  );
  const color = getCartItemColor(item) ?? product.colors?.[0] ?? '#ffffff';
  const printBounds = useMemo(
    () => getOverlayPrintBounds(getProductMockupLayout(product)),
    [product],
  );
  const can3d = Boolean(sideDesign);
  const show3d = can3d && mode === '3d';

  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      {can3d ? (
        <div
          className="inline-flex self-start rounded-md border border-ink-200 bg-white p-0.5"
          role="tablist"
          aria-label={t('preview3dLabel')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={!show3d}
            onClick={() => setMode('flat')}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition',
              !show3d ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            <Box className="h-3 w-3" aria-hidden />
            {t('previewStills')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={show3d}
            onClick={() => setMode('3d')}
            className={cn(
              'inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition',
              show3d ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            <Rotate3d className="h-3 w-3" aria-hidden />
            {t('preview3d')}
          </button>
        </div>
      ) : null}

      {show3d && sideDesign ? (
        <div className="h-48 w-[9.5rem] overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
          <DrinkwareDesignPreview3D
            productType={product.type}
            productId={product.id}
            shirtColor={color}
            sideDesign={sideDesign}
            designTemplate={null}
            printBounds={printBounds}
            textLayers={sideDesign.textLayers}
            variant="cart"
            className="h-full w-full"
          />
        </div>
      ) : (
        <div className="flex gap-1.5">
          {previewImages.map((img, index) => (
            <button
              key={`${item.id}-${index}`}
              type="button"
              onClick={() => onOpenLightbox(index)}
              className="group relative flex h-36 w-[6.75rem] shrink-0 aspect-[3/4] items-center justify-center overflow-hidden rounded-lg border border-ink-200 bg-ink-50 transition hover:border-brand-400 hover:ring-2 hover:ring-brand-200"
              aria-label={t('zoomPreview')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.label ?? ''}
                className="h-full w-full object-contain transition group-hover:scale-105"
              />
              {img.label && previewImages.length > 1 ? (
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5 text-center text-[9px] font-medium text-white">
                  {img.label}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
