'use client';

import { Download } from 'lucide-react';
import { getSvgPrintFilesFromMetadata } from '@/lib/designs/svg-order-assets';
import { adminStrings } from '@/lib/admin/strings';

export function OrderSvgPrintFiles({
  itemName,
  metadata,
}: {
  itemName: string;
  metadata: Record<string, string | number | boolean>;
}) {
  const files = getSvgPrintFilesFromMetadata(metadata, itemName);
  if (files.length === 0) return null;

  function downloadFile(svg: string, filename: string) {
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

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
          <button
            key={file.filename}
            type="button"
            onClick={() => downloadFile(file.svg, file.filename)}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-300 bg-white px-3 py-2 text-sm font-medium text-brand-800 transition hover:bg-brand-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {file.side === 'front'
              ? adminStrings.orderDetail.downloadFrontSvg
              : adminStrings.orderDetail.downloadBackSvg}
          </button>
        ))}
      </div>
    </div>
  );
}
