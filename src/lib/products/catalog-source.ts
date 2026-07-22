/**
 * Controls where storefront merch designs (`productDesignTemplates`) are loaded from.
 *
 * - `database` — active rows in `managed_product_designs` (fallback to code packs if DB empty)
 * - `merge` — code packs + DB overrides (legacy / local admin edits)
 * - `static` — code packs only
 *
 * Env: `CATALOG_SOURCE=database|merge|static`
 * Default when unset: `database` if `VERCEL_ENV=production` or `NEXT_PUBLIC_ASSETS_CDN_URL` is set;
 * otherwise `merge` (safe local/dev with optional admin overrides).
 *
 * TODO(products): blank SKUs (`products[]` in catalog.ts) still come from code.
 * Add `managed_products` (JSONB) + seed + same source flag when ready — do not half-wire checkout.
 *
 * Couple pack *metadata* (`couplePackTemplates`) remains in code for now; partner design
 * rows are included in `productDesignTemplates` and seed into `managed_product_designs`.
 */

export type CatalogSource = 'database' | 'merge' | 'static';

export function getCatalogSource(): CatalogSource {
  const raw = process.env.CATALOG_SOURCE?.trim().toLowerCase();
  if (raw === 'database' || raw === 'merge' || raw === 'static') {
    return raw;
  }

  if (
    process.env.VERCEL_ENV === 'production' ||
    Boolean(process.env.NEXT_PUBLIC_ASSETS_CDN_URL?.trim())
  ) {
    return 'database';
  }

  return 'merge';
}

export function isDatabaseCatalogSource(): boolean {
  return getCatalogSource() === 'database';
}
