'use client';

import { Download } from 'lucide-react';
import { listSvgPrintFileRefsFromMetadata } from '@/lib/designs/svg-order-assets';
import { adminStrings } from '@/lib/admin/strings';

export function OrderSvgPrintFiles({
  orderId,
  itemIndex,
  itemName,
  metadata,
}: {
  orderId: string;
  itemIndex: number;
  itemName: string;
  metadata: Record<string, string | number | boolean>;
}) {
  const files = listSvgPrintFileRefsFromMetadata(metadata, itemName);
  if (files.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50/70 p-3">
      <p className="text-sm font-semibold text-brand-900">
        {adminStrings.orderDetail.printReadySvg}
      </p>
      <p className="mt-1 text-xs text-brand-800/80">
        {adminStrings.orderDetail.printReadySvgHint}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {files.map((file) => (
          <a
            key={file.filename}
            href={`/api/admin/orders/${orderId}/print/${itemIndex}/${file.side}`}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {file.side === 'front'
              ? adminStrings.orderDetail.downloadFrontSvg
              : adminStrings.orderDetail.downloadBackSvg}
          </a>
        ))}
      </div>
    </div>
  );
}
