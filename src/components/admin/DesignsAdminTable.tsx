'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { CatalogDesignRecord } from '@/lib/db/catalog-designs';
import { getDesignAvailabilityLabel } from '@/lib/designs/design-reservations';
import { cn } from '@/lib/utils';

const availabilityStyles: Record<CatalogDesignRecord['availability'], string> = {
  available: 'bg-emerald-100 text-emerald-800',
  reserved: 'bg-amber-100 text-amber-800',
  sold: 'bg-ink-100 text-ink-700',
  draft: 'bg-slate-100 text-slate-700',
  archived: 'bg-red-100 text-red-800',
};

export function DesignsAdminTable({
  initialDesigns,
}: {
  initialDesigns: CatalogDesignRecord[];
}) {
  const [designs, setDesigns] = useState(initialDesigns);
  const [search, setSearch] = useState('');
  const [availability, setAvailability] = useState<'all' | CatalogDesignRecord['availability']>('all');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return designs.filter((design) => {
      if (availability !== 'all' && design.availability !== availability) {
        return false;
      }
      if (!query) return true;
      return [design.id, design.nameEn, design.nameMk, design.category]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [availability, designs, search]);

  async function refresh() {
    const response = await fetch('/api/admin/designs');
    if (!response.ok) return;
    const data = await response.json();
    setDesigns(data.designs);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium text-ink-700">Пребарај</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ID, име, категорија…"
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
            />
          </label>
          <label className="text-sm sm:w-48">
            <span className="mb-1 block font-medium text-ink-700">Статус</span>
            <select
              value={availability}
              onChange={(event) =>
                setAvailability(event.target.value as typeof availability)
              }
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
            >
              <option value="all">Сите</option>
              <option value="available">Достапни</option>
              <option value="reserved">Резервирани</option>
              <option value="sold">Продадени</option>
              <option value="draft">Нацрт</option>
              <option value="archived">Архивирани</option>
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/designs/new"
            className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            + Нов дизајн
          </Link>
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50"
          >
            Освежи
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        <table className="min-w-full divide-y divide-ink-100 text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Дизајн</th>
              <th className="px-4 py-3">Категорија</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Ексклузивен</th>
              <th className="px-4 py-3">Цена</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered.map((design) => (
              <tr key={design.id} className="hover:bg-ink-50/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink-900">{design.nameMk}</div>
                  <div className="text-xs text-ink-500">{design.id}</div>
                </td>
                <td className="px-4 py-3 text-ink-600">{design.category}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                      availabilityStyles[design.availability],
                    )}
                  >
                    {getDesignAvailabilityLabel(design.availability)}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {design.exclusive ? 'Да' : 'Не'}
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {design.price ? `${design.price} ден.` : 'Стандардна'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/designs/${design.id}`}
                    className="font-medium text-brand-700 hover:text-brand-800"
                  >
                    Уреди
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-500">
            Нема дизајни што одговараат на филтрите.
          </p>
        ) : null}
      </div>
    </div>
  );
}
