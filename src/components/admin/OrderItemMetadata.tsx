'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { splitOrderMetadata } from '@/lib/admin/order-metadata';
import { adminStrings } from '@/lib/admin/strings';
import { cn } from '@/lib/utils';

function MetadataList({
  entries,
}: {
  entries: Array<{ key: string; label: string; value: string }>;
}) {
  return (
    <dl className="grid gap-2 text-sm">
      {entries.map((entry) => (
        <div key={entry.key}>
          <dt className="text-ink-500">{entry.label}</dt>
          <dd className="font-medium text-ink-800 break-words">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function OrderItemMetadata({
  metadata,
}: {
  metadata: Record<string, string | number | boolean>;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { essential, advanced } = splitOrderMetadata(metadata);

  if (essential.length === 0 && advanced.length === 0) return null;

  return (
    <div className="mt-3 space-y-3">
      {essential.length > 0 ? <MetadataList entries={essential} /> : null}

      {advanced.length > 0 ? (
        <div className="rounded-lg border border-ink-100 bg-ink-50/60">
          <button
            type="button"
            onClick={() => setShowAdvanced((open) => !open)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-ink-700"
          >
            {adminStrings.orderDetail.advancedInfo}
            <ChevronDown
              className={cn('h-4 w-4 shrink-0 transition', showAdvanced && 'rotate-180')}
            />
          </button>
          {showAdvanced ? (
            <div className="border-t border-ink-100 px-3 py-3">
              <MetadataList entries={advanced} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
