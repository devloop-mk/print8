'use client';

import { useMemo } from 'react';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import type { GarmentFit } from '@/lib/data/catalog';
import { GARMENT_FIT_ORDER } from '@/lib/products/garment-fit';

const FIT_LABELS: Record<GarmentFit, string> = {
  unisex: 'Унисекс',
  women: 'Женски',
  kids: 'Детски',
};

type ProductDesignFitMatrixProps = {
  applicableFits: GarmentFit[];
  onApplicableFitsChange: (fits: GarmentFit[]) => void;
  productTypes: ProductDesignTemplate['productTypes'];
};

export function ProductDesignFitMatrix({
  applicableFits,
  onApplicableFitsChange,
  productTypes,
}: ProductDesignFitMatrixProps) {
  const isTshirt = productTypes.includes('t-shirt');

  const applicableSet = useMemo(
    () => new Set(applicableFits),
    [applicableFits],
  );

  if (!isTshirt) {
    return (
      <p className="rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-4 text-sm text-ink-500">
        Кројот (унисекс / женски / детски) важи само за маици.
      </p>
    );
  }

  function toggleFit(fit: GarmentFit, enabled: boolean) {
    const next = new Set(applicableFits);
    if (enabled) next.add(fit);
    else next.delete(fit);
    const ordered = GARMENT_FIT_ORDER.filter((entry) => next.has(entry));
    onApplicableFitsChange(ordered.length > 0 ? ordered : ['unisex']);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-600">
        Означете на кои кроеви е достапен дизајнот. Ако е избран само еден, на
        страницата нема да се прикаже избор.
      </p>
      <div className="flex flex-wrap gap-3">
        {GARMENT_FIT_ORDER.map((fit) => (
          <label
            key={fit}
            className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={applicableSet.has(fit)}
              onChange={(event) => toggleFit(fit, event.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-brand-600"
            />
            <span className="font-medium text-ink-800">{FIT_LABELS[fit]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
