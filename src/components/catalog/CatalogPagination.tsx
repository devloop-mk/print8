'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  CATALOG_PAGE_SIZE,
  clampCatalogPage,
  getCatalogPageCount,
} from '@/lib/catalog/pagination';

type CatalogPaginationProps = {
  page: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageLabel: (current: number, total: number) => string;
  className?: string;
};

export function CatalogPagination({
  page,
  totalItems,
  pageSize = CATALOG_PAGE_SIZE,
  onPageChange,
  previousLabel,
  nextLabel,
  pageLabel,
  className,
}: CatalogPaginationProps) {
  const totalPages = getCatalogPageCount(totalItems, pageSize);
  if (totalItems <= pageSize) return null;

  const currentPage = clampCatalogPage(page, totalItems, pageSize);

  return (
    <nav
      aria-label={pageLabel(currentPage, totalPages)}
      className={cn(
        'flex flex-col items-center gap-3 border-t border-ink-100 pt-6 sm:flex-row sm:justify-between',
        className,
      )}
    >
      <p className="text-sm text-ink-600">
        {pageLabel(currentPage, totalPages)}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="gap-1.5"
        >
          <ChevronLeft className="h-4 w-4" />
          {previousLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="gap-1.5"
        >
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
