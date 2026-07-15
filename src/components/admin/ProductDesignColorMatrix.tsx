'use client';

import { useMemo } from 'react';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import { getAdminDesignColorOptions } from '@/lib/admin/product-designs-shared';
import {
  AdminDesignColorPreview,
  resolveAdminPreviewProduct,
} from '@/components/admin/AdminDesignColorPreview';
import { getProductColorLabelKey } from '@/lib/products/product-color-labels';
import { normalizeHex } from '@/lib/products/design-overlay';
import { TSHIRT_UNISEX_COLORS } from '@/lib/products/tshirt-unisex-colors';
import { AdminAssetUploader } from '@/components/admin/AdminAssetUploader';
import { cn } from '@/lib/utils';

const ADMIN_COLOR_LABELS_MK: Record<string, string> = Object.fromEntries(
  TSHIRT_UNISEX_COLORS.map((color) => [normalizeHex(color.hex), color.labelKey]),
);

type ProductDesignColorMatrixProps = {
  template: ProductDesignTemplate;
  applicableColors: string[];
  overlayColorVariants: Record<string, string>;
  onApplicableColorsChange: (colors: string[]) => void;
  onVariantsChange: (variants: Record<string, string>) => void;
  uploadFolder: string;
};

function getColorLabelMk(hex: string): string {
  const key =
    getProductColorLabelKey(hex) ?? ADMIN_COLOR_LABELS_MK[normalizeHex(hex)];
  const mkLabels: Record<string, string> = {
    white: 'Бела',
    black: 'Црна',
    red: 'Црвена',
    navy: 'Тегет',
    green: 'Зелена',
    gray: 'Сива',
    royalBlue: 'Мастило',
    olive: 'Маслинеста',
    cream: 'Крем',
    blue: 'Сина',
    heatherGray: 'Сива',
    beige: 'Беж',
    lightBlue: 'Светло сина',
    charcoal: 'Јаглен',
    stone: 'Камен',
    ice: 'Мраз',
  };
  if (key && mkLabels[key]) return mkLabels[key];
  return hex;
}

function isColorEnabled(hex: string, applicableColors: string[]): boolean {
  if (applicableColors.length === 0) return true;
  return applicableColors.some(
    (color) => normalizeHex(color) === normalizeHex(hex),
  );
}

export function ProductDesignColorMatrix({
  template,
  applicableColors,
  overlayColorVariants,
  onApplicableColorsChange,
  onVariantsChange,
  uploadFolder,
}: ProductDesignColorMatrixProps) {
  const colorOptions = useMemo(
    () => getAdminDesignColorOptions(template),
    [template],
  );

  const previewProduct = useMemo(
    () => resolveAdminPreviewProduct(template),
    [template],
  );

  const allHexes = useMemo(
    () => colorOptions.map((option) => normalizeHex(option.hex)),
    [colorOptions],
  );

  const enabledCount = useMemo(() => {
    if (applicableColors.length === 0) return colorOptions.length;
    return colorOptions.filter((option) =>
      isColorEnabled(option.hex, applicableColors),
    ).length;
  }, [applicableColors, colorOptions]);

  const hasDesignOverlay = Boolean(
    template.printMasterImage || template.overlayImage || template.overlaySvg,
  );

  function setEnabledColors(next: Set<string>) {
    if (next.size === allHexes.length) {
      onApplicableColorsChange([]);
      return;
    }
    onApplicableColorsChange([...next]);
  }

  function toggleColor(hex: string) {
    const normalized = normalizeHex(hex);
    const current = new Set(
      applicableColors.length === 0
        ? allHexes
        : applicableColors.map(normalizeHex),
    );

    if (current.has(normalized)) {
      if (current.size <= 1) return;
      current.delete(normalized);
    } else {
      current.add(normalized);
    }

    setEnabledColors(current);
  }

  function selectAllColors() {
    onApplicableColorsChange([]);
  }

  function updateVariant(hex: string, value: string) {
    onVariantsChange({
      ...overlayColorVariants,
      [normalizeHex(hex)]: value,
    });
  }

  if (!previewProduct) {
    return (
      <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-4 text-sm text-ink-500">
        Нема поврзан производ за преглед на боите.
      </p>
    );
  }

  if (colorOptions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-4 text-sm text-ink-500">
        Нема бои за прикажување — додајте тип производ (на пр. t-shirt).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600">
          Кликнете на боја за да ја вклучите/исклучите. Празен избор = сите
          бои се достапни на страницата.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-500">
            {enabledCount}/{colorOptions.length} активни
          </span>
          <button
            type="button"
            onClick={selectAllColors}
            className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-ink-50"
          >
            Сите бои
          </button>
        </div>
      </div>

      {!hasDesignOverlay ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Додајте printMasterImage или overlayImage за да се види дизајнот на
          прегледите.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {colorOptions.map((option) => {
          const enabled = isColorEnabled(option.hex, applicableColors);
          const variant = overlayColorVariants[normalizeHex(option.hex)] ?? '';

          return (
            <div
              key={option.hex}
              className={cn(
                'overflow-hidden rounded-xl border bg-white transition',
                enabled
                  ? 'border-brand-400 ring-2 ring-brand-200'
                  : 'border-ink-200 opacity-55',
              )}
            >
              <button
                type="button"
                onClick={() => toggleColor(option.hex)}
                className="block w-full text-left"
                aria-pressed={enabled}
              >
                <AdminDesignColorPreview
                  product={previewProduct}
                  design={template}
                  color={option.hex}
                />
              </button>

              <div className="flex items-center justify-between gap-2 border-t border-ink-100 px-3 py-2">
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggleColor(option.hex)}
                    className="h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600"
                  />
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-ink-200"
                    style={{ backgroundColor: option.hex }}
                  />
                  <span className="truncate text-sm font-medium text-ink-800">
                    {getColorLabelMk(option.hex)}
                  </span>
                </label>
                <span className="shrink-0 text-[11px] text-ink-400">
                  {option.hex}
                </span>
              </div>

              <details className="border-t border-ink-100 px-3 py-2 text-xs text-ink-500">
                <summary className="cursor-pointer font-medium text-ink-600">
                  Variant слика (опционално)
                </summary>
                <div className="mt-2 flex flex-col gap-2">
                  <input
                    type="text"
                    value={variant}
                    onChange={(event) =>
                      updateVariant(option.hex, event.target.value)
                    }
                    placeholder="/product-designs/..."
                    className="w-full rounded-lg border border-ink-200 px-2 py-1.5 text-sm"
                  />
                  <AdminAssetUploader
                    folder={uploadFolder}
                    onUploaded={(url) => updateVariant(option.hex, url)}
                  />
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
