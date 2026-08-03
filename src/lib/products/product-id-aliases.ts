/**
 * Legacy product URL/SKU ids → current catalog ids.
 * Keep entries forever (or until traffic dies) so bookmarks, carts, CMS
 * productIds, and drafts still resolve after a rename.
 */
export const PRODUCT_ID_ALIASES: Readonly<Record<string, string>> = {
  'tshirt-basic-white': 'tshirt-unisex',
};

/** Map a stored / URL product id to the current catalog id. */
export function resolveProductId(id: string): string {
  return PRODUCT_ID_ALIASES[id] ?? id;
}

/** All known ids (legacy + canonical) for a product. */
export function productIdVariants(id: string): string[] {
  const canonical = resolveProductId(id);
  const legacy = Object.entries(PRODUCT_ID_ALIASES)
    .filter(([, target]) => target === canonical)
    .map(([legacyId]) => legacyId);
  return [canonical, ...legacy.filter((legacyId) => legacyId !== canonical)];
}

/** Whether a design/CMS productIds list refers to this catalog product. */
export function productIdsInclude(
  productIds: readonly string[] | undefined | null,
  productId: string,
): boolean {
  if (!productIds?.length) return false;
  const canonical = resolveProductId(productId);
  return productIds.some((id) => resolveProductId(id) === canonical);
}
