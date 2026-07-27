'use client';

import { useMemo, useState, type DragEvent } from 'react';
import Image from 'next/image';
import { GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import { adminStrings } from '@/lib/admin/strings';
import { cn } from '@/lib/utils';

export type DisplayOrderItem = {
  id: string;
  title: string;
  image?: string;
  meta?: string;
  collection?: string | null;
};

type Tab = 'products' | 'merchDesigns' | 'printDesigns';

const SEARCH_RESULT_LIMIT = 12;

function matchesQuery(item: DisplayOrderItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return (
    item.id.toLowerCase().includes(q) ||
    item.title.toLowerCase().includes(q) ||
    (item.meta ?? '').toLowerCase().includes(q)
  );
}

function moveItem<T extends { id: string }>(
  items: T[],
  id: string,
  direction: -1 | 1,
): T[] {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return items;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return items;
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

function setItemFirst<T extends { id: string }>(items: T[], id: string): T[] {
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return items;
  if (index === 0) return items;
  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.unshift(item);
  return copy;
}

function reorderByDrag<T extends { id: string }>(
  items: T[],
  fromId: string,
  toId: string,
): T[] {
  if (fromId === toId) return items;
  const fromIndex = items.findIndex((item) => item.id === fromId);
  const toIndex = items.findIndex((item) => item.id === toId);
  if (fromIndex < 0 || toIndex < 0) return items;
  const copy = [...items];
  const [item] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, item);
  return copy;
}

function SetFirstSearch({
  items,
  onSetFirst,
}: {
  items: DisplayOrderItem[];
  onSetFirst: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    if (!query.trim()) return [];
    return items.filter((item) => matchesQuery(item, query)).slice(0, SEARCH_RESULT_LIMIT);
  }, [items, query]);

  return (
    <div className="space-y-2 rounded-xl border border-ink-200 bg-white p-3 sm:p-4">
      <label className="block text-sm">
        <span className="font-medium text-ink-900">
          {adminStrings.ordering.searchLabel}
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={adminStrings.ordering.searchPlaceholder}
          className="mt-1 w-full border border-ink-200 bg-white px-3 py-2 text-sm"
        />
      </label>
      {query.trim() ? (
        results.length === 0 ? (
          <p className="text-sm text-ink-500">{adminStrings.ordering.searchNoResults}</p>
        ) : (
          <ul className="divide-y divide-ink-100 rounded-lg border border-ink-100">
            {results.map((item) => {
              const position = items.findIndex((row) => row.id === item.id) + 1;
              const isFirst = position === 1;
              return (
                <li
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 sm:gap-3"
                >
                  <span className="w-8 shrink-0 text-xs font-semibold text-ink-500">
                    #{position}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {item.meta ?? item.id}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={isFirst ? 'ghost' : 'outline'}
                    disabled={isFirst}
                    onClick={() => {
                      onSetFirst(item.id);
                      setQuery('');
                    }}
                  >
                    {isFirst
                      ? adminStrings.ordering.alreadyFirst
                      : adminStrings.ordering.setFirst}
                  </Button>
                </li>
              );
            })}
          </ul>
        )
      ) : null}
    </div>
  );
}

function ReorderList({
  items,
  onMove,
  onDragReorder,
}: {
  items: DisplayOrderItem[];
  onMove: (id: string, direction: -1 | 1) => void;
  onDragReorder: (fromId: string, toId: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-sm text-ink-500">
        {adminStrings.ordering.empty}
      </p>
    );
  }

  function handleDragStart(event: DragEvent<HTMLElement>, id: string) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea')) {
      event.preventDefault();
      return;
    }
    setDragId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  }

  function handleDragOver(event: DragEvent<HTMLElement>, id: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    if (overId !== id) setOverId(id);
  }

  function handleDrop(event: DragEvent<HTMLElement>, toId: string) {
    event.preventDefault();
    const fromId = event.dataTransfer.getData('text/plain') || dragId;
    if (fromId) onDragReorder(fromId, toId);
    setDragId(null);
    setOverId(null);
  }

  function handleDragEnd() {
    setDragId(null);
    setOverId(null);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-500">{adminStrings.ordering.dragHint}</p>
      {items.map((item, index) => (
        <div
          key={item.id}
          onDragOver={(event) => handleDragOver(event, item.id)}
          onDrop={(event) => handleDrop(event, item.id)}
          className={cn(
            'flex items-center gap-2 rounded-xl border bg-white p-2 sm:gap-3 sm:p-3',
            dragId === item.id
              ? 'border-brand-300 opacity-60'
              : overId === item.id
                ? 'border-brand-400 bg-brand-50/40'
                : 'border-ink-200',
          )}
        >
          <span
            draggable
            onDragStart={(event) => handleDragStart(event, item.id)}
            onDragEnd={handleDragEnd}
            className="flex h-9 w-7 shrink-0 cursor-grab items-center justify-center text-ink-400 active:cursor-grabbing"
            aria-label={adminStrings.ordering.dragHandle}
            role="button"
            tabIndex={0}
          >
            <GripVertical className="h-4 w-4" />
          </span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink-100 text-xs font-bold text-ink-700">
            #{index + 1}
          </span>
          {item.image ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-ink-50 sm:h-14 sm:w-14">
              <Image
                src={resolveAssetUrl(item.image)}
                alt=""
                fill
                draggable={false}
                className="pointer-events-none object-contain p-1"
                sizes="56px"
              />
            </div>
          ) : (
            <div className="h-12 w-12 shrink-0 bg-ink-100 sm:h-14 sm:w-14" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-900">{item.title}</p>
            <p className="truncate text-xs text-ink-500">{item.meta ?? item.id}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onMove(item.id, -1)}
              disabled={index === 0}
              aria-label={adminStrings.ordering.moveUp}
            >
              ↑
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onMove(item.id, 1)}
              disabled={index === items.length - 1}
              aria-label={adminStrings.ordering.moveDown}
            >
              ↓
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DisplayOrderAdminPanel({
  products,
  merchDesigns,
  printDesigns,
  merchCollectionLabels,
  printCategoryLabels,
}: {
  products: DisplayOrderItem[];
  merchDesigns: DisplayOrderItem[];
  printDesigns: DisplayOrderItem[];
  merchCollectionLabels: Record<string, string>;
  printCategoryLabels: Record<string, string>;
}) {
  const [tab, setTab] = useState<Tab>('products');
  const [productItems, setProductItems] = useState(products);
  const [merchDesignItems, setMerchDesignItems] = useState(merchDesigns);
  const [printDesignItems, setPrintDesignItems] = useState(printDesigns);
  const [merchCollectionFilter, setMerchCollectionFilter] = useState<string>('all');
  const [printCategoryFilter, setPrintCategoryFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const merchCollections = useMemo(() => {
    const set = new Set<string>();
    for (const design of merchDesignItems) {
      if (design.collection) set.add(design.collection);
    }
    return [...set].sort((a, b) =>
      (merchCollectionLabels[a] ?? a).localeCompare(
        merchCollectionLabels[b] ?? b,
        'mk',
      ),
    );
  }, [merchCollectionLabels, merchDesignItems]);

  const printCategories = useMemo(() => {
    const set = new Set<string>();
    for (const design of printDesignItems) {
      if (design.collection) set.add(design.collection);
    }
    return [...set].sort((a, b) =>
      (printCategoryLabels[a] ?? a).localeCompare(
        printCategoryLabels[b] ?? b,
        'mk',
      ),
    );
  }, [printCategoryLabels, printDesignItems]);

  const scopedMerchDesigns = useMemo(() => {
    if (merchCollectionFilter === 'all') return merchDesignItems;
    return merchDesignItems.filter(
      (design) => design.collection === merchCollectionFilter,
    );
  }, [merchCollectionFilter, merchDesignItems]);

  const scopedPrintDesigns = useMemo(() => {
    if (printCategoryFilter === 'all') return printDesignItems;
    return printDesignItems.filter(
      (design) => design.collection === printCategoryFilter,
    );
  }, [printCategoryFilter, printDesignItems]);

  function mapScopedDesigns(
    prev: DisplayOrderItem[],
    nextScoped: DisplayOrderItem[],
    activeFilter: string,
  ): DisplayOrderItem[] {
    let scopedIndex = 0;
    return prev.map((item) => {
      if (activeFilter !== 'all' && item.collection !== activeFilter) {
        return item;
      }
      const next = nextScoped[scopedIndex];
      scopedIndex += 1;
      return next ?? item;
    });
  }

  function applyMerchDesignScoped(
    transform: (scoped: DisplayOrderItem[]) => DisplayOrderItem[],
  ) {
    setMerchDesignItems((prev) => {
      const scoped =
        merchCollectionFilter === 'all'
          ? prev
          : prev.filter((design) => design.collection === merchCollectionFilter);
      return mapScopedDesigns(prev, transform(scoped), merchCollectionFilter);
    });
  }

  function applyPrintDesignScoped(
    transform: (scoped: DisplayOrderItem[]) => DisplayOrderItem[],
  ) {
    setPrintDesignItems((prev) => {
      const scoped =
        printCategoryFilter === 'all'
          ? prev
          : prev.filter((design) => design.collection === printCategoryFilter);
      return mapScopedDesigns(prev, transform(scoped), printCategoryFilter);
    });
  }

  async function saveProducts() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/admin/display-order/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: productItems.map((item, index) => ({
            id: item.id,
            sortOrder: index,
          })),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? adminStrings.ordering.saveError);
      }
      setMessage(adminStrings.ordering.productsSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : adminStrings.ordering.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function saveMerchDesigns() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const scope = merchDesignItems.filter(
        (design) =>
          merchCollectionFilter === 'all' ||
          design.collection === merchCollectionFilter,
      );
      const response = await fetch('/api/admin/display-order/designs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: scope.map((item, index) => ({
            id: item.id,
            sortOrder: index,
          })),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? adminStrings.ordering.saveError);
      }
      setMessage(adminStrings.ordering.merchDesignsSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : adminStrings.ordering.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function savePrintDesigns() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const scope = printDesignItems.filter(
        (design) =>
          printCategoryFilter === 'all' ||
          design.collection === printCategoryFilter,
      );
      const response = await fetch('/api/admin/display-order/print-designs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: scope.map((item, index) => ({
            id: item.id,
            sortOrder: index,
          })),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? adminStrings.ordering.saveError);
      }
      setMessage(adminStrings.ordering.printDesignsSaved);
    } catch (err) {
      setError(err instanceof Error ? err.message : adminStrings.ordering.saveError);
    } finally {
      setSaving(false);
    }
  }

  function setProductFirst(id: string) {
    const target = productItems.find((item) => item.id === id);
    if (!target) return;
    const index = productItems.findIndex((item) => item.id === id);
    if (index === 0) {
      setMessage(adminStrings.ordering.alreadyFirst);
      return;
    }
    setProductItems((prev) => setItemFirst(prev, id));
    setMessage(adminStrings.ordering.setFirstDone(target.title));
    setError(null);
  }

  function setMerchDesignFirst(id: string) {
    const target = scopedMerchDesigns.find((item) => item.id === id);
    if (!target) return;
    const index = scopedMerchDesigns.findIndex((item) => item.id === id);
    if (index === 0) {
      setMessage(adminStrings.ordering.alreadyFirst);
      return;
    }
    applyMerchDesignScoped((scoped) => setItemFirst(scoped, id));
    setMessage(adminStrings.ordering.setFirstDone(target.title));
    setError(null);
  }

  function setPrintDesignFirst(id: string) {
    const target = scopedPrintDesigns.find((item) => item.id === id);
    if (!target) return;
    const index = scopedPrintDesigns.findIndex((item) => item.id === id);
    if (index === 0) {
      setMessage(adminStrings.ordering.alreadyFirst);
      return;
    }
    applyPrintDesignScoped((scoped) => setItemFirst(scoped, id));
    setMessage(adminStrings.ordering.setFirstDone(target.title));
    setError(null);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={tab === 'products' ? 'primary' : 'outline'}
          onClick={() => {
            setTab('products');
            setMessage(null);
            setError(null);
          }}
        >
          {adminStrings.ordering.tabProducts}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === 'merchDesigns' ? 'primary' : 'outline'}
          onClick={() => {
            setTab('merchDesigns');
            setMessage(null);
            setError(null);
          }}
        >
          {adminStrings.ordering.tabMerchDesigns}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === 'printDesigns' ? 'primary' : 'outline'}
          onClick={() => {
            setTab('printDesigns');
            setMessage(null);
            setError(null);
          }}
        >
          {adminStrings.ordering.tabPrintDesigns}
        </Button>
      </div>

      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {tab === 'products' ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">{adminStrings.ordering.productsHelp}</p>
          <SetFirstSearch items={productItems} onSetFirst={setProductFirst} />
          <ReorderList
            items={productItems}
            onMove={(id, direction) =>
              setProductItems((prev) => moveItem(prev, id, direction))
            }
            onDragReorder={(fromId, toId) =>
              setProductItems((prev) => reorderByDrag(prev, fromId, toId))
            }
          />
          <Button type="button" onClick={saveProducts} disabled={saving}>
            {saving ? adminStrings.ordering.saving : adminStrings.ordering.saveProducts}
          </Button>
        </div>
      ) : tab === 'merchDesigns' ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">
            {adminStrings.ordering.merchDesignsHelp}
          </p>
          <label className="block text-sm sm:max-w-sm">
            <span className="font-medium text-ink-900">
              {adminStrings.ordering.collectionFilter}
            </span>
            <select
              value={merchCollectionFilter}
              onChange={(event) => setMerchCollectionFilter(event.target.value)}
              className="mt-1 w-full border border-ink-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">{adminStrings.ordering.allCollections}</option>
              {merchCollections.map((collection) => (
                <option key={collection} value={collection}>
                  {merchCollectionLabels[collection] ?? collection}
                </option>
              ))}
            </select>
          </label>
          <SetFirstSearch items={scopedMerchDesigns} onSetFirst={setMerchDesignFirst} />
          <p className="text-xs text-ink-500">
            {adminStrings.ordering.visibleCount(scopedMerchDesigns.length)}
          </p>
          <ReorderList
            items={scopedMerchDesigns}
            onMove={(id, direction) =>
              applyMerchDesignScoped((scoped) => moveItem(scoped, id, direction))
            }
            onDragReorder={(fromId, toId) =>
              applyMerchDesignScoped((scoped) => reorderByDrag(scoped, fromId, toId))
            }
          />
          <Button
            type="button"
            onClick={saveMerchDesigns}
            disabled={saving || scopedMerchDesigns.length === 0}
          >
            {saving
              ? adminStrings.ordering.saving
              : adminStrings.ordering.saveMerchDesigns}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">
            {adminStrings.ordering.printDesignsHelp}
          </p>
          <label className="block text-sm sm:max-w-sm">
            <span className="font-medium text-ink-900">
              {adminStrings.ordering.categoryFilter}
            </span>
            <select
              value={printCategoryFilter}
              onChange={(event) => setPrintCategoryFilter(event.target.value)}
              className="mt-1 w-full border border-ink-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">{adminStrings.ordering.allCategories}</option>
              {printCategories.map((category) => (
                <option key={category} value={category}>
                  {printCategoryLabels[category] ?? category}
                </option>
              ))}
            </select>
          </label>
          <SetFirstSearch items={scopedPrintDesigns} onSetFirst={setPrintDesignFirst} />
          <p className="text-xs text-ink-500">
            {adminStrings.ordering.visibleCount(scopedPrintDesigns.length)}
          </p>
          <ReorderList
            items={scopedPrintDesigns}
            onMove={(id, direction) =>
              applyPrintDesignScoped((scoped) => moveItem(scoped, id, direction))
            }
            onDragReorder={(fromId, toId) =>
              applyPrintDesignScoped((scoped) => reorderByDrag(scoped, fromId, toId))
            }
          />
          <Button
            type="button"
            onClick={savePrintDesigns}
            disabled={saving || scopedPrintDesigns.length === 0}
          >
            {saving
              ? adminStrings.ordering.saving
              : adminStrings.ordering.savePrintDesigns}
          </Button>
        </div>
      )}
    </section>
  );
}
