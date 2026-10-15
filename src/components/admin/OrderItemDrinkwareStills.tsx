'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { captureDrinkware3DPreviews } from '@/components/products/customizer/Drinkware3DCapture';
import { getOrderItemDrinkwarePreviewModel } from '@/components/admin/OrderItemDrinkware3DPreview';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { adminStrings } from '@/lib/admin/strings';
import type { OrderItem } from '@/lib/orders/order-item-previews';
import { downloadDataUrl } from '@/lib/download/data-url';

export function OrderItemDrinkwareStills({
  item,
  safeName,
}: {
  item: OrderItem;
  safeName: string;
}) {
  const t = adminStrings.orderDetail;
  const model = useMemo(() => getOrderItemDrinkwarePreviewModel(item), [item]);
  const [stills, setStills] = useState<
    { src: string; label: string }[] | null
  >(null);

  useEffect(() => {
    if (!model) return;
    let cancelled = false;
    setStills(null);

    void captureDrinkware3DPreviews({
      productType: model.product.type,
      productId: model.product.id,
      productColor: model.color,
      sideDesign: model.sideDesign,
      designTemplate: null,
      textLayers: model.sideDesign.textLayers,
      printBounds: model.printBounds,
    }).then((result) => {
      if (cancelled) return;
      if (result?.front || result?.left || result?.right) {
        setStills(
          [
            { src: result.front, label: 'Front' },
            { src: result.left, label: 'Left' },
            { src: result.right, label: 'Right' },
          ].filter((still) => still.src.startsWith('data:')),
        );
        return;
      }
      const fallback = [
        item.designPreview?.startsWith('data:')
          ? { src: item.designPreview, label: 'Front' }
          : null,
        item.leftDesignPreview?.startsWith('data:')
          ? { src: item.leftDesignPreview, label: 'Left' }
          : null,
        item.rightDesignPreview?.startsWith('data:')
          ? { src: item.rightDesignPreview, label: 'Right' }
          : null,
      ].filter((still): still is { src: string; label: string } => still !== null);
      setStills(fallback);
    });

    return () => {
      cancelled = true;
    };
  }, [model, item]);

  if (!model) return null;

  if (!stills) {
    return (
      <div className="flex min-h-[8rem] items-center justify-center rounded-lg border border-white bg-white p-4 shadow-sm">
        <LoadingIndicator label={t.preview3dStillsLoading} size="sm" />
      </div>
    );
  }

  if (stills.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {stills.map((still) => (
        <div
          key={still.label}
          className="rounded-lg border border-white bg-white p-2 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
              {still.label} — {t.previewMockupSuffix}
            </p>
            <button
              type="button"
              onClick={() =>
                downloadDataUrl(
                  still.src,
                  `${safeName}-${still.label.toLowerCase()}.png`,
                )
              }
              className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {t.downloadPreview}
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={still.src}
            alt={still.label}
            className="max-h-56 w-full rounded border border-ink-100 bg-white object-contain"
          />
        </div>
      ))}
    </div>
  );
}
