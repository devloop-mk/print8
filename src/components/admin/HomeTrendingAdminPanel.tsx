'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { CmsHomeTrendingRecord } from '@/lib/db/cms';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import { Button } from '@/components/ui/Button';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import { resolveProductDesignDisplayName } from '@/lib/products/design-display-name';

type DesignOption = {
  id: string;
  title: string;
  image?: string;
};

export function HomeTrendingAdminPanel({
  initialEntries,
  designOptions,
}: {
  initialEntries: CmsHomeTrendingRecord[];
  designOptions: DesignOption[];
}) {
  const [entries, setEntries] = useState(
    [...initialEntries].sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = useMemo(() => new Set(entries.map((e) => e.designId)), [entries]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return designOptions.slice(0, 24);
    return designOptions
      .filter(
        (option) =>
          option.id.toLowerCase().includes(q) ||
          option.title.toLowerCase().includes(q),
      )
      .slice(0, 24);
  }, [designOptions, query]);

  function addDesign(designId: string) {
    if (selectedIds.has(designId) || entries.length >= 7) return;
    setEntries((prev) => [
      ...prev,
      { designId, sortOrder: prev.length, active: true, updatedAt: '' },
    ]);
  }

  function removeDesign(designId: string) {
    setEntries((prev) =>
      prev
        .filter((entry) => entry.designId !== designId)
        .map((entry, index) => ({ ...entry, sortOrder: index })),
    );
  }

  function moveDesign(designId: string, direction: -1 | 1) {
    setEntries((prev) => {
      const index = prev.findIndex((entry) => entry.designId === designId);
      if (index < 0) return prev;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy.map((entry, sortOrder) => ({ ...entry, sortOrder }));
    });
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch('/api/admin/home-trending', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: entries.map((entry, index) => ({
            designId: entry.designId,
            sortOrder: index,
            active: entry.active,
          })),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save trending designs');
      }
      const data = await response.json();
      setEntries(data.entries ?? entries);
      setMessage('Зачувани тренд дизајни за почетна.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trending designs');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Тренд маици (почетна)</h2>
        <p className="text-sm text-ink-500">
          Изберете до 7 streetwear / t-shirt дизајни за секцијата „Trending“ на почетната.
          Празна листа = вградени стандардни дизајни.
        </p>
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

      <div className="space-y-3">
        {entries.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-sm text-ink-500">
            Нема избрани дизајни — на сајтот се прикажуваат стандардните тренд маици.
          </p>
        ) : (
          entries.map((entry, index) => {
            const option = designOptions.find((item) => item.id === entry.designId);
            return (
              <div
                key={entry.designId}
                className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-ink-100 text-xs font-bold text-ink-700">
                  #{index + 1}
                </span>
                {option?.image ? (
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-ink-50">
                    <Image
                      src={resolveAssetUrl(option.image)}
                      alt=""
                      fill
                      className="object-contain p-1"
                      sizes="56px"
                    />
                  </div>
                ) : (
                  <div className="h-14 w-14 shrink-0 bg-ink-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {option?.title ?? entry.designId}
                  </p>
                  <p className="truncate text-xs text-ink-500">{entry.designId}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => moveDesign(entry.designId, -1)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => moveDesign(entry.designId, 1)}
                    disabled={index === entries.length - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeDesign(entry.designId)}
                  >
                    Отстрани
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
        <label className="text-sm font-medium text-ink-900">Додај дизајн</label>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Пребарај по ID или име…"
          className="mt-2 w-full border border-ink-200 bg-white px-3 py-2 text-sm"
        />
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {filteredOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={selectedIds.has(option.id) || entries.length >= 7}
              onClick={() => addDesign(option.id)}
              className="flex w-full items-center gap-3 border border-ink-200 bg-white px-3 py-2 text-left text-sm transition hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {option.image ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden bg-ink-50">
                  <Image
                    src={resolveAssetUrl(option.image)}
                    alt=""
                    fill
                    className="object-contain p-0.5"
                    sizes="40px"
                  />
                </div>
              ) : null}
              <span className="min-w-0 flex-1 truncate font-medium text-ink-900">
                {option.title}
              </span>
              <span className="shrink-0 text-xs text-ink-500">{option.id}</span>
            </button>
          ))}
        </div>
      </div>

      <Button type="button" onClick={save} disabled={saving}>
        {saving ? 'Зачувување…' : 'Зачувај тренд маици'}
      </Button>
    </section>
  );
}

export function buildTrendingDesignOptions(
  templates: ProductDesignTemplate[],
): DesignOption[] {
  return templates
    .filter((template) => template.productTypes.includes('t-shirt'))
    .map((template) => ({
      id: template.id,
      title: template.titleMk || template.titleEn || template.id,
      image:
        'overlayImage' in template && template.overlayImage
          ? template.overlayImage
          : undefined,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'mk'));
}
