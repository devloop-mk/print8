'use client';

import { Download } from 'lucide-react';
import { listSvgPrintFileRefsFromMetadata } from '@/lib/designs/svg-order-assets';
import {
  getOrderItemPreviewImages,
  sanitizeOrderItemFilename,
  type OrderItem,
} from '@/lib/orders/order-item-previews';
import { adminStrings } from '@/lib/admin/strings';

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function OrderItemDesignAssets({
  orderId,
  item,
  itemIndex,
  itemCount,
}: {
  orderId: string;
  item: OrderItem;
  itemIndex: number;
  itemCount: number;
}) {
  const t = adminStrings.orderDetail;
  const previews = getOrderItemPreviewImages(item);
  const svgFiles = item.metadata
    ? listSvgPrintFileRefsFromMetadata(item.metadata, item.name)
    : [];
  const safeName = sanitizeOrderItemFilename(item.name, `item-${itemIndex + 1}`);

  if (previews.length === 0 && svgFiles.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50/40 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-900">
          {t.designAssetsTitle}
        </p>
        {itemCount > 1 ? (
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
            {t.itemPosition.replace('{current}', String(itemIndex + 1)).replace('{total}', String(itemCount))}
          </span>
        ) : null}
      </div>

      {previews.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {previews.map((preview) => (
            <div
              key={`${preview.label}-${preview.src.slice(0, 32)}`}
              className="rounded-lg border border-white bg-white p-2 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  {preview.label}
                </p>
                {preview.src.startsWith('data:') ? (
                  <button
                    type="button"
                    onClick={() =>
                      downloadDataUrl(
                        preview.src,
                        `${safeName}-${preview.label.toLowerCase().replace(/\s+/g, '-')}.png`,
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.downloadPreview}
                  </button>
                ) : null}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.src}
                alt={preview.label}
                className="max-h-56 w-full rounded border border-ink-100 bg-white object-contain"
              />
            </div>
          ))}
        </div>
      ) : null}

      {svgFiles.length > 0 ? (
        <div className={previews.length > 0 ? 'mt-4 border-t border-brand-200/80 pt-4' : ''}>
          <p className="text-xs font-medium text-brand-800">{t.printReadySvgHint}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {svgFiles.map((file) => (
              <a
                key={file.filename}
                href={`/api/admin/orders/${orderId}/print/${itemIndex}/${file.side}`}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-50"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {file.side === 'front' ? t.downloadFrontSvg : t.downloadBackSvg}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
