'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { adminStrings } from '@/lib/admin/strings';
import { cn } from '@/lib/utils';

const DEFAULT_VISIBLE = 3;

export function TopPagesList({
  pages,
}: {
  pages: Array<{ path: string; views: number }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = adminStrings.dashboardPage;

  if (pages.length === 0) {
    return <p className="mt-3 text-sm text-ink-500">{t.noTraffic}</p>;
  }

  const canCollapse = pages.length > DEFAULT_VISIBLE;
  const visiblePages =
    expanded || !canCollapse ? pages : pages.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = pages.length - DEFAULT_VISIBLE;

  return (
    <div className="mt-3">
      <div className="divide-y divide-ink-100">
        {visiblePages.map((page) => (
          <div
            key={page.path}
            className="flex items-center justify-between gap-3 py-2.5 text-sm"
          >
            <span className="min-w-0 truncate text-ink-700">{page.path}</span>
            <span className="shrink-0 font-medium text-ink-900">
              {page.views}
            </span>
          </div>
        ))}
      </div>

      {canCollapse ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          {expanded ? t.showLessPages : t.showAllPages(hiddenCount)}
          <ChevronDown
            className={cn('h-4 w-4 transition', expanded && 'rotate-180')}
          />
        </button>
      ) : null}
    </div>
  );
}
