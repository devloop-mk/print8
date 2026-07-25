export const CATALOG_PAGE_SIZE = 24;

/** Smaller page size for design galleries with live SVG previews. */
export const DESIGN_GALLERY_PAGE_SIZE = 12;

/** Ready photo designs block on product type pages (e.g. /products/type/t-shirt). */
export const PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZES = [12, 24] as const;
export const PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZE =
  PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZES[0];

export function parseCatalogPage(
  value: string | null | undefined,
): number {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
}

export function parseCatalogPageSize(
  value: string | null | undefined,
  allowed: readonly number[] = PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZES,
  fallback: number = PRODUCT_TYPE_READY_DESIGNS_PAGE_SIZE,
): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return allowed.includes(parsed) ? parsed : fallback;
}

export function getCatalogPageCount(
  totalItems: number,
  pageSize = CATALOG_PAGE_SIZE,
): number {
  return Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize));
}

export function clampCatalogPage(
  page: number,
  totalItems: number,
  pageSize = CATALOG_PAGE_SIZE,
): number {
  return Math.min(Math.max(1, page), getCatalogPageCount(totalItems, pageSize));
}

export function sliceCatalogPage<T>(
  items: readonly T[],
  page: number,
  pageSize = CATALOG_PAGE_SIZE,
): T[] {
  const safePage = clampCatalogPage(page, items.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
