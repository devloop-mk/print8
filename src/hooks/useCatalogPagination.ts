'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  CATALOG_PAGE_SIZE,
  clampCatalogPage,
  parseCatalogPage,
  sliceCatalogPage,
} from '@/lib/catalog/pagination';

type UseCatalogPaginationOptions = {
  totalItems: number;
  pageSize?: number;
  extraParams?: Record<string, string | undefined>;
  /** When true, page changes update the URL without scrolling to the top. */
  preventScroll?: boolean;
};

export function useCatalogPagination({
  totalItems,
  pageSize = CATALOG_PAGE_SIZE,
  extraParams,
  preventScroll = false,
}: UseCatalogPaginationOptions) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const page = useMemo(
    () => clampCatalogPage(parseCatalogPage(searchParams.get('page')), totalItems, pageSize),
    [pageSize, searchParams, totalItems],
  );

  const buildHref = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (extraParams) {
        for (const [key, value] of Object.entries(extraParams)) {
          if (value) params.set(key, value);
          else params.delete(key);
        }
      }

      if (nextPage <= 1) params.delete('page');
      else params.set('page', String(nextPage));

      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [extraParams, pathname, searchParams],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const clamped = clampCatalogPage(nextPage, totalItems, pageSize);
      router.push(buildHref(clamped), { scroll: !preventScroll });
    },
    [buildHref, pageSize, preventScroll, router, totalItems],
  );

  const resetPage = useCallback(() => {
    if (page <= 1) return;
    router.replace(buildHref(1), { scroll: false });
  }, [buildHref, page, router]);

  const paginate = useCallback(
    <T,>(items: readonly T[]) => sliceCatalogPage(items, page, pageSize),
    [page, pageSize],
  );

  return { page, setPage, resetPage, paginate };
}
