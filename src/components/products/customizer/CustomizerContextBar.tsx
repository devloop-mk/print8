'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SelectedElement } from '@/components/products/customizer/types';
import type { SideDesign } from '@/lib/products/design-state';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import { CUSTOMIZER_FONTS, type CustomizerFontId } from '@/lib/products/customizer-fonts';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import {
  inksHaveLowContrast,
  suggestInkForShirt,
} from '@/lib/products/design-overlay';
import {
  PRODUCT_PHOTO_MIN_SCALE,
  PRODUCT_PRINT_AREA_MAX_SCALE,
} from '@/lib/products/customizer-constants';
import { clampPhotoScale } from '@/lib/products/crop-image';

function MiniStepper({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-600 hover:bg-ink-50"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[3ch] text-center text-xs font-medium text-ink-800">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-600 hover:bg-ink-50"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CustomizerContextBar({
  selected,
  currentDesign,
  designTemplate,
  shirtColor,
  onUpdate,
  onUpdateTextLayer,
  printTextSizeMax = 72,
  onRemove,
  overlayMaxScale = PRODUCT_PRINT_AREA_MAX_SCALE,
}: {
  selected: SelectedElement;
  currentDesign: SideDesign;
  designTemplate: ProductDesignTemplate | null | undefined;
  shirtColor: string;
  onUpdate: (updates: Partial<SideDesign>) => void;
  onUpdateTextLayer: (
    instanceId: string,
    updates: Partial<PlacedTextLayer>,
  ) => void;
  printTextSizeMax?: number;
  onRemove: (target: SelectedElement) => void;
  overlayMaxScale?: number;
}) {
  const t = useTranslations('products.customizer');

  if (!selected) return null;

  const hasSecondaryInk = designTemplate?.overlayRecolor?.slots === 2;
  const primaryInk = currentDesign.overlaySvgColors?.primary ?? '#F4EDE4';
  const secondaryInk =
    currentDesign.overlaySvgColors?.secondary ?? primaryInk;
  const selectedTextLayer = selected.startsWith('text:')
    ? currentDesign.textLayers.find(
        (layer) => layer.instanceId === selected.replace('text:', ''),
      )
    : null;

  return (
    <div className="pointer-events-auto mx-auto flex min-h-[2.75rem] max-w-3xl flex-wrap items-center justify-center gap-2 rounded-xl border border-ink-200/80 bg-white px-3 py-2 shadow-lg">
      {selectedTextLayer ? (
        <>
          <span className="text-xs font-medium text-ink-500">{t('text')}</span>
          <select
            value={selectedTextLayer.fontFamily}
            onChange={(e) =>
              onUpdateTextLayer(selectedTextLayer.instanceId, {
                fontFamily: e.target.value as CustomizerFontId,
              })
            }
            className="h-8 max-w-[8.5rem] rounded-md border border-ink-200 bg-white px-2 text-xs text-ink-800"
            aria-label={t('textFont')}
          >
            {CUSTOMIZER_FONTS.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label}
              </option>
            ))}
          </select>
          <input
            type="color"
            value={selectedTextLayer.color}
            onChange={(e) =>
              onUpdateTextLayer(selectedTextLayer.instanceId, {
                color: e.target.value,
              })
            }
            className="h-8 w-12 cursor-pointer rounded-md border border-ink-200"
            aria-label={t('textColor')}
          />
          <MiniStepper
            value={selectedTextLayer.size}
            onChange={(v) =>
              onUpdateTextLayer(selectedTextLayer.instanceId, { size: v })
            }
            min={12}
            max={printTextSizeMax}
            step={2}
          />
        </>
      ) : null}

      {selected === 'photo' || selected === 'overlay' ? (
        <>
          <span className="text-xs font-medium text-ink-500">
            {selected === 'overlay' ? t('designColor') : t('photo')}
          </span>
          {selected === 'overlay' && currentDesign.isRecolorableOverlay ? (
            <>
              <input
                type="color"
                value={primaryInk}
                onChange={(e) =>
                  onUpdate({
                    overlaySvgColors: {
                      primary: e.target.value,
                      secondary: currentDesign.overlaySvgColors?.secondary,
                    },
                  })
                }
                className="h-8 w-12 cursor-pointer rounded-md border border-ink-200"
                aria-label={t('designPrimaryColor')}
              />
              {hasSecondaryInk ? (
                <input
                  type="color"
                  value={secondaryInk}
                  onChange={(e) =>
                    onUpdate({
                      overlaySvgColors: {
                        primary:
                          currentDesign.overlaySvgColors?.primary ?? primaryInk,
                        secondary: e.target.value,
                      },
                    })
                  }
                  className="h-8 w-12 cursor-pointer rounded-md border border-ink-200"
                  aria-label={t('designSecondaryColor')}
                />
              ) : null}
              {inksHaveLowContrast(primaryInk, shirtColor) ? (
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      overlaySvgColors: {
                        primary: suggestInkForShirt(shirtColor),
                        secondary: designTemplate?.overlayRecolor?.secondary
                          ? suggestInkForShirt(shirtColor) === '#F4EDE4'
                            ? '#8B7355'
                            : '#C4B5A0'
                          : undefined,
                      },
                    })
                  }
                  className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800"
                >
                  {t('designAutoContrast')}
                </button>
              ) : null}
            </>
          ) : null}
          <MiniStepper
            value={currentDesign.uploadedImageScale}
            onChange={(v) =>
              onUpdate({ uploadedImageScale: clampPhotoScale(v, overlayMaxScale) })
            }
            min={PRODUCT_PHOTO_MIN_SCALE}
            max={overlayMaxScale}
            step={2}
          />
        </>
      ) : null}

      {selected.startsWith('sticker:') ? (
        <>
          <span className="text-xs font-medium text-ink-500">{t('stickers')}</span>
          <MiniStepper
            value={
              currentDesign.stickers.find(
                (s) => `sticker:${s.instanceId}` === selected,
              )?.scale ?? 24
            }
            onChange={(v) => {
              const id = selected.replace('sticker:', '');
              onUpdate({
                stickers: currentDesign.stickers.map((sticker) =>
                  sticker.instanceId === id ? { ...sticker, scale: v } : sticker,
                ),
              });
            }}
            min={12}
            max={52}
            step={2}
          />
        </>
      ) : null}

      {selected !== 'overlay' ? (
        <button
          type="button"
          onClick={() => onRemove(selected)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-red-50 hover:text-red-600"
          aria-label={t('deleteElement')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
