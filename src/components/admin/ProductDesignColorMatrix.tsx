'use client';

import { useMemo } from 'react';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import { getDesignColorOptions } from '@/lib/admin/product-designs-shared';
import { getProductColorLabelKey } from '@/lib/products/product-color-labels';
import { normalizeHex } from '@/lib/products/design-overlay';
import { AdminAssetUploader } from '@/components/admin/AdminAssetUploader';

type ProductDesignColorMatrixProps = {
  template: ProductDesignTemplate;
  applicableColors: string[];
  overlayColorVariants: Record<string, string>;
  onApplicableColorsChange: (colors: string[]) => void;
  onVariantsChange: (variants: Record<string, string>) => void;
  uploadFolder: string;
};

export function ProductDesignColorMatrix({
  template,
  applicableColors,
  overlayColorVariants,
  onApplicableColorsChange,
  onVariantsChange,
  uploadFolder,
}: ProductDesignColorMatrixProps) {
  const colorOptions = useMemo(
    () => getDesignColorOptions(template),
    [template],
  );

  const applicableSet = useMemo(
    () => new Set(applicableColors.map(normalizeHex)),
    [applicableColors],
  );

  function toggleColor(hex: string, enabled: boolean) {
    const normalized = normalizeHex(hex);
    const next = new Set(applicableColors.map(normalizeHex));
    if (enabled) next.add(normalized);
    else next.delete(normalized);
    onApplicableColorsChange([...next]);
  }

  function updateVariant(hex: string, value: string) {
    onVariantsChange({
      ...overlayColorVariants,
      [normalizeHex(hex)]: value,
    });
  }

  if (colorOptions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-4 text-sm text-ink-500">
        Нема поврзани бои — прво изберете тип производ или конкретни производи.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-600">
        Означете на кои бои е достапен дизајнот. По потреба додадете посебна
        слика за печатење по боја (variant).
      </p>
      <div className="overflow-hidden rounded-xl border border-ink-200">
        <table className="min-w-full divide-y divide-ink-100 text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-3 py-2">Боја</th>
              <th className="px-3 py-2">Достапна</th>
              <th className="px-3 py-2">Variant слика</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 bg-white">
            {colorOptions.map((option) => {
              const enabled = applicableSet.has(normalizeHex(option.hex));
              const variant =
                overlayColorVariants[normalizeHex(option.hex)] ?? '';

              return (
                <tr key={option.hex}>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-6 w-6 rounded-full border border-ink-200"
                        style={{ backgroundColor: option.hex }}
                      />
                      <div>
                        <p className="font-medium text-ink-800">
                          {getProductColorLabelKey(option.hex) ?? option.hex}
                        </p>
                        <p className="text-xs text-ink-500">{option.hex}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) =>
                        toggleColor(option.hex, event.target.checked)
                      }
                      className="h-4 w-4 rounded border-ink-300 text-brand-600"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        type="text"
                        value={variant}
                        onChange={(event) =>
                          updateVariant(option.hex, event.target.value)
                        }
                        placeholder="/product-designs/..."
                        className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
                      />
                      <AdminAssetUploader
                        folder={uploadFolder}
                        onUploaded={(url) => updateVariant(option.hex, url)}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
