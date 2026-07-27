'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  GarmentFit,
  Product,
  ProductDesignTemplate,
  ProductType,
} from '@/lib/data/catalog';
import {
  getAdminDesignColorOptions,
  PRODUCT_TYPE_LABELS_MK,
} from '@/lib/admin/product-designs-shared';
import {
  AdminDesignColorPreview,
  resolveAdminPreviewProduct,
} from '@/components/admin/AdminDesignColorPreview';
import {
  getDesignApplicableColors,
  getDesignFitPalette,
  getDesignProductTypePalette,
} from '@/lib/products/design-applicable-colors';
import { getDesignApplicableFits } from '@/lib/products/garment-fit';
import { getProductColorLabelKey } from '@/lib/products/product-color-labels';
import { normalizeHex } from '@/lib/products/design-overlay';
import { TSHIRT_UNISEX_COLORS } from '@/lib/products/tshirt-unisex-colors';
import { AdminAssetUploader } from '@/components/admin/AdminAssetUploader';
import { cn } from '@/lib/utils';

const ADMIN_COLOR_LABELS_MK: Record<string, string> = Object.fromEntries(
  TSHIRT_UNISEX_COLORS.map((color) => [normalizeHex(color.hex), color.labelKey]),
);

const FIT_LABELS: Record<GarmentFit, string> = {
  unisex: 'Унисекс',
  women: 'Женски',
  kids: 'Детски',
};

type ProductDesignColorMatrixProps = {
  template: ProductDesignTemplate;
  applicableColors: string[];
  applicableColorsByFit?: Partial<Record<GarmentFit, string[]>>;
  applicableColorsByProductType?: Partial<Record<ProductType, string[]>>;
  applicableFits: GarmentFit[];
  overlayColorVariants: Record<string, string>;
  onApplicableColorsChange: (colors: string[]) => void;
  onApplicableColorsByFitChange: (
    colorsByFit: Partial<Record<GarmentFit, string[]>>,
  ) => void;
  onApplicableColorsByProductTypeChange: (
    colorsByType: Partial<Record<ProductType, string[]>>,
  ) => void;
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

function buildDesignForColorPreview(
  template: ProductDesignTemplate,
  colors: string[],
  productType: ProductType,
  fit?: GarmentFit,
): ProductDesignTemplate {
  if (productType === 't-shirt' && fit) {
    return {
      ...template,
      applicableColors: undefined,
      applicableColorsByFit: {
        ...template.applicableColorsByFit,
        [fit]: colors,
      },
      applicableColorsByProductType: undefined,
    };
  }

  if (productType !== 't-shirt') {
    return {
      ...template,
      applicableColors: undefined,
      applicableColorsByFit: undefined,
      applicableColorsByProductType: {
        ...template.applicableColorsByProductType,
        [productType]: colors,
      },
    };
  }

  return {
    ...template,
    applicableColorsByFit: undefined,
    applicableColorsByProductType: undefined,
    applicableColors: colors,
  };
}

export function ProductDesignColorMatrix({
  template,
  applicableColors,
  applicableColorsByFit = {},
  applicableColorsByProductType = {},
  applicableFits,
  overlayColorVariants,
  onApplicableColorsChange,
  onApplicableColorsByFitChange,
  onApplicableColorsByProductTypeChange,
  onVariantsChange,
  uploadFolder,
}: ProductDesignColorMatrixProps) {
  const previewTypesKey = template.productTypes.join('|') || 't-shirt';
  const previewTypes = useMemo(
    () =>
      template.productTypes.length
        ? template.productTypes
        : (['t-shirt'] as ProductType[]),
    [previewTypesKey],
  );
  const teeFits = useMemo(
    () =>
      template.productTypes.includes('t-shirt')
        ? getDesignApplicableFits({ ...template, applicableFits })
        : [],
    [applicableFits, template],
  );

  const [previewType, setPreviewType] = useState<ProductType>(
    () => previewTypes[0],
  );
  const [previewFit, setPreviewFit] = useState<GarmentFit>(
    () => teeFits[0] ?? 'unisex',
  );

  useEffect(() => {
    setPreviewType(previewTypes[0]);
  }, [previewTypesKey, previewTypes]);

  useEffect(() => {
    if (!teeFits.includes(previewFit)) {
      setPreviewFit(teeFits[0] ?? 'unisex');
    }
  }, [teeFits, previewFit]);

  const designForColors = useMemo(
    () => ({
      ...template,
      applicableColors,
      applicableColorsByFit,
      applicableColorsByProductType,
      applicableFits,
    }),
    [
      applicableColors,
      applicableColorsByFit,
      applicableColorsByProductType,
      applicableFits,
      template,
    ],
  );

  const usesFitPalettes = previewType === 't-shirt' && teeFits.length > 0;
  const usesTypePalettes = previewType !== 't-shirt';
  const activeFit = usesFitPalettes ? previewFit : undefined;

  const activeApplicableColors = useMemo(() => {
    if (usesFitPalettes && activeFit) {
      const palette = getDesignFitPalette(designForColors, activeFit);
      if (palette !== null) return palette;
      // Per-fit tab — never read shared applicableColors (women-only edits used to pollute it).
      return [];
    }
    if (usesTypePalettes) {
      const palette = getDesignProductTypePalette(designForColors, previewType);
      if (palette !== null) return palette;
      return [];
    }
    return applicableColors;
  }, [
    activeFit,
    designForColors,
    previewType,
    usesFitPalettes,
    usesTypePalettes,
    applicableColors,
  ]);

  const colorOptions = useMemo(
    () => getAdminDesignColorOptions(template, previewType, activeFit),
    [activeFit, previewType, template],
  );

  const previewProduct = useMemo(
    () => resolveAdminPreviewProduct(template, previewType, activeFit),
    [activeFit, previewType, template],
  );

  const allHexes = useMemo(
    () => colorOptions.map((option) => normalizeHex(option.hex)),
    [colorOptions],
  );

  const enabledCanonicalHexes = useMemo(() => {
    if (!previewProduct) return new Set<string>();
    if (activeApplicableColors.length === 0) {
      return new Set(allHexes);
    }
    return new Set(
      getDesignApplicableColors(
        buildDesignForColorPreview(
          designForColors,
          activeApplicableColors,
          previewType,
          activeFit,
        ),
        previewProduct,
      ).map(normalizeHex),
    );
  }, [
    activeApplicableColors,
    activeFit,
    allHexes,
    designForColors,
    previewProduct,
    previewType,
  ]);

  const enabledCount = useMemo(() => {
    if (activeApplicableColors.length === 0) return colorOptions.length;
    return colorOptions.filter((option) =>
      enabledCanonicalHexes.has(normalizeHex(option.hex)),
    ).length;
  }, [activeApplicableColors, colorOptions, enabledCanonicalHexes]);

  const applicablePaletteMismatch = useMemo(() => {
    if (!previewProduct || activeApplicableColors.length === 0) return false;
    const applicableForProduct = getDesignApplicableColors(
      buildDesignForColorPreview(
        designForColors,
        activeApplicableColors,
        previewType,
        activeFit,
      ),
      previewProduct,
    );
    return applicableForProduct.length === 0;
  }, [
    activeApplicableColors,
    activeFit,
    designForColors,
    previewProduct,
    previewType,
  ]);

  function persistApplicableColors(colors: string[]) {
    if (usesFitPalettes && activeFit) {
      const isFirstFitCustomization =
        Object.keys(applicableColorsByFit).length === 0;
      const next: Partial<Record<GarmentFit, string[]>> = {
        ...applicableColorsByFit,
        [activeFit]: colors,
      };

      // First per-fit edit: snapshot legacy palette onto other fits so they
      // stay independent (e.g. women's black must not shrink unisex).
      if (isFirstFitCustomization) {
        for (const fit of teeFits) {
          if (fit !== activeFit && next[fit] === undefined) {
            next[fit] =
              applicableColors.length > 0 ? [...applicableColors] : [];
          }
        }
      }

      onApplicableColorsByFitChange(next);
      return;
    }
    if (usesTypePalettes) {
      const isFirstTypeCustomization =
        Object.keys(applicableColorsByProductType).length === 0;
      const next: Partial<Record<ProductType, string[]>> = {
        ...applicableColorsByProductType,
        [previewType]: colors,
      };

      if (isFirstTypeCustomization) {
        for (const type of previewTypes) {
          if (
            type !== previewType &&
            type !== 't-shirt' &&
            next[type] === undefined
          ) {
            next[type] =
              applicableColors.length > 0 ? [...applicableColors] : [];
          }
        }
      }

      onApplicableColorsByProductTypeChange(next);
      return;
    }
    onApplicableColorsChange(colors);
  }

  // Migrate legacy hex keys to supplier palette for the active fit / type.
  useEffect(() => {
    if (!previewProduct || activeApplicableColors.length === 0) return;

    const canonical = colorOptions
      .filter((option) =>
        enabledCanonicalHexes.has(normalizeHex(option.hex)),
      )
      .map((option) => option.hex);

    const storedKeys = new Set(activeApplicableColors.map(normalizeHex));
    const canonicalKeys = new Set(canonical.map(normalizeHex));
    const alreadyCanonical =
      storedKeys.size === canonicalKeys.size &&
      [...storedKeys].every((key) => canonicalKeys.has(key));

    if (!alreadyCanonical) {
      persistApplicableColors(canonical);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- persist only when stored palette drifts
  }, [
    activeApplicableColors,
    colorOptions,
    enabledCanonicalHexes,
    previewProduct,
    activeFit,
    previewType,
  ]);

  const hasDesignOverlay = Boolean(
    template.printMasterImage || template.overlayImage || template.overlaySvg,
  );

  function setEnabledColors(next: Set<string>) {
    if (next.size === allHexes.length) {
      persistApplicableColors([]);
      return;
    }
    const saved = colorOptions
      .filter((option) => next.has(normalizeHex(option.hex)))
      .map((option) => option.hex);
    persistApplicableColors(saved);
  }

  function toggleColor(hex: string) {
    const normalized = normalizeHex(hex);
    const current = new Set(enabledCanonicalHexes);

    if (current.has(normalized)) {
      if (current.size <= 1) return;
      current.delete(normalized);
    } else {
      current.add(normalized);
    }

    setEnabledColors(current);
  }

  function selectAllColors() {
    persistApplicableColors([]);
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
        Нема бои за прикажување — додајте тип производ (на пр. боди или маица).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {previewTypes.length > 1 ? (
        <div className="flex flex-wrap gap-1 rounded-lg border border-ink-200 p-1">
          {previewTypes.map((type) => {
            const customized =
              type === 't-shirt'
                ? Object.keys(applicableColorsByFit).length > 0
                : applicableColorsByProductType[type] !== undefined;
            return (
            <button
              key={type}
              type="button"
              onClick={() => setPreviewType(type)}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs font-medium',
                previewType === type
                  ? 'bg-brand-700 text-white'
                  : 'text-ink-600 hover:bg-ink-50',
              )}
            >
              {PRODUCT_TYPE_LABELS_MK[type] ?? type}
              {customized ? (
                <span
                  className={cn(
                    'ml-1 inline-block h-1.5 w-1.5 rounded-full',
                    previewType === type ? 'bg-white' : 'bg-brand-500',
                  )}
                  title="Прилагодени бои за овој тип"
                />
              ) : null}
            </button>
            );
          })}
        </div>
      ) : null}

      {usesFitPalettes && teeFits.length > 1 ? (
        <div className="flex flex-wrap gap-1 rounded-lg border border-ink-200 p-1">
          {teeFits.map((fit) => {
            const customized = applicableColorsByFit[fit] !== undefined;
            return (
              <button
                key={fit}
                type="button"
                onClick={() => setPreviewFit(fit)}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium',
                  previewFit === fit
                    ? 'bg-brand-700 text-white'
                    : 'text-ink-600 hover:bg-ink-50',
                )}
              >
                {FIT_LABELS[fit]}
                {customized ? (
                  <span
                    className={cn(
                      'ml-1 inline-block h-1.5 w-1.5 rounded-full',
                      previewFit === fit ? 'bg-white' : 'bg-brand-500',
                    )}
                    title="Прилагодени бои за овој крој"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-600">
          Кликнете на боја за да ја вклучите/исклучите. Празен избор = сите
          бои се достапни на страницата.
          {previewProduct ? (
            <span className="ml-1 text-ink-400">
              (преглед: {PRODUCT_TYPE_LABELS_MK[previewType] ?? previewType}
              {activeFit ? ` · ${FIT_LABELS[activeFit]}` : ''})
            </span>
          ) : null}
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

      {applicablePaletteMismatch ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Избраните бои не одговараат на палетата за{' '}
          {PRODUCT_TYPE_LABELS_MK[previewType] ?? previewType}
          {activeFit ? ` (${FIT_LABELS[activeFit]})` : ''}. Кликнете на боите
          подоле за да ги прилагодите.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {colorOptions.map((option) => {
          const normalized = normalizeHex(option.hex);
          const enabled =
            activeApplicableColors.length === 0 ||
            enabledCanonicalHexes.has(normalized);
          const variant = overlayColorVariants[normalized] ?? '';

          return (
            <div
              key={`${previewType}-${activeFit ?? 'default'}-${normalized}`}
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

                <div className="flex items-center justify-between gap-2 border-t border-ink-100 px-3 py-2">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-ink-300',
                        enabled && 'border-brand-600 bg-brand-600 text-white',
                      )}
                      aria-hidden
                    >
                      {enabled ? (
                        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                          <path
                            d="M2.5 6l2.5 2.5L9.5 4"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                    <span
                      className="h-5 w-5 shrink-0 rounded-full border border-ink-200"
                      style={{ backgroundColor: option.hex }}
                    />
                    <span className="truncate text-sm font-medium text-ink-800">
                      {getColorLabelMk(option.hex)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-400">
                    {option.hex}
                  </span>
                </div>
              </button>

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
