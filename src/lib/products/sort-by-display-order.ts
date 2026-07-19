/** Client-safe sort by admin display order (asc), then original index. */

type OrderSource =
  | ReadonlyMap<string, number>
  | Readonly<Record<string, number>>
  | null
  | undefined;

function readOrder(source: OrderSource, id: string): number | undefined {
  if (!source) return undefined;
  if (source instanceof Map) return source.get(id);
  return Object.prototype.hasOwnProperty.call(source, id)
    ? (source as Record<string, number>)[id]
    : undefined;
}

function hasEntries(source: OrderSource): boolean {
  if (!source) return false;
  if (source instanceof Map) return source.size > 0;
  return Object.keys(source).length > 0;
}

export function sortByDisplayOrder<T extends { id: string }>(
  items: readonly T[],
  orderMap: OrderSource,
): T[] {
  if (!hasEntries(orderMap) || items.length < 2) return [...items];

  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const orderA = readOrder(orderMap, a.item.id);
      const orderB = readOrder(orderMap, b.item.id);
      const rankA = orderA !== undefined ? orderA : 100_000 + a.index;
      const rankB = orderB !== undefined ? orderB : 100_000 + b.index;
      if (rankA !== rankB) return rankA - rankB;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}
