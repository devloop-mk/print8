'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type {
  AdminDesignListPage,
  AdminDesignStorage,
} from '@/lib/admin/designs-shared';
import { DESIGN_CATEGORY_OPTIONS } from '@/lib/admin/designs-shared';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { cn } from '@/lib/utils';
import {
  clampCatalogPage,
  getCatalogPageCount,
} from '@/lib/catalog/pagination';

export function DesignsAdminTable({
  initialResult,
  initialSearch,
  initialStorage,
  initialCategory,
}: {
  initialResult: AdminDesignListPage;
  initialSearch: string;
  initialStorage: AdminDesignStorage;
  initialCategory: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { items, total, page, pageSize, inDatabaseCount, codeOnlyCount, svgTemplateCount } =
    initialResult;

  function buildHref(patch: {
    page?: number;
    q?: string;
    storage?: AdminDesignStorage;
    category?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextPage = patch.page ?? page;
    const nextSearch = patch.q ?? initialSearch;
    const nextStorage = patch.storage ?? initialStorage;
    const nextCategory = patch.category ?? initialCategory;

    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    else params.delete('q');

    if (nextCategory && nextCategory !== 'all') params.set('category', nextCategory);
    else params.delete('category');

    if (nextStorage !== 'all') params.set('storage', nextStorage);
    else params.delete('storage');

    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));

    const query = params.toString();
    return query ? `/admin/designs?${query}` : '/admin/designs';
  }

  function navigate(href: string) {
    startTransition(() => {
      router.push(href);
      router.refresh();
    });
  }

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get('q') ?? '');
    const storage = String(
      formData.get('storage') ?? 'all',
    ) as AdminDesignStorage;
    const category = String(formData.get('category') ?? 'all');
    navigate(buildHref({ page: 1, q, storage, category }));
  }

  const totalPages = getCatalogPageCount(total, pageSize);
  const currentPage = clampCatalogPage(page, total, pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ink-200 bg-white p-4 text-sm text-ink-600">
        <p>
          Вкупно <strong>{total}</strong> дизајни од кодот.{' '}
          <strong>{svgTemplateCount}</strong> имаат SVG шаблон за уредување на
          стандардни текстови и бои.{' '}
          <strong>{inDatabaseCount}</strong> се во база (цена, видливост),{' '}
          <strong>{codeOnlyCount}</strong> се само во кодот.
        </p>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-4 lg:flex-row lg:items-end"
      >
        <label className="flex-1 text-sm">
          <span className="mb-1 block font-medium text-ink-700">Пребарај</span>
          <input
            name="q"
            defaultValue={initialSearch}
            placeholder="ID, име, категорија…"
            className="w-full rounded-lg border border-ink-200 px-3 py-2"
          />
        </label>
        <label className="text-sm lg:w-48">
          <span className="mb-1 block font-medium text-ink-700">Категорија</span>
          <select
            name="category"
            defaultValue={initialCategory}
            className="w-full rounded-lg border border-ink-200 px-3 py-2"
          >
            <option value="all">Сите</option>
            {DESIGN_CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm lg:w-48">
          <span className="mb-1 block font-medium text-ink-700">Извор</span>
          <select
            name="storage"
            defaultValue={initialStorage}
            className="w-full rounded-lg border border-ink-200 px-3 py-2"
          >
            <option value="all">Сите</option>
            <option value="database">Во база</option>
            <option value="code-only">Само код</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
        >
          Филтрирај
        </button>
      </form>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        <table className="min-w-full divide-y divide-ink-100 text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Дизајн</th>
              <th className="px-4 py-3">Категорија</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Извор</th>
              <th className="px-4 py-3">Стандардни</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((design) => (
              <tr key={design.id} className="hover:bg-ink-50/60">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink-900">{design.title}</div>
                  <div className="text-xs text-ink-500">{design.id}</div>
                </td>
                <td className="px-4 py-3 text-ink-600">{design.category}</td>
                <td className="px-4 py-3 text-ink-600">
                  {design.kind}
                  {design.hasSvgTemplate ? ' · SVG' : ''}
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {design.inDatabase ? 'База' : 'Код'}
                </td>
                <td className="px-4 py-3">
                  {design.hasSvgTemplate ? (
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                        design.hasDefaultsOverride
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-ink-100 text-ink-600',
                      )}
                    >
                      {design.hasDefaultsOverride ? 'Уредено' : 'Код'}
                    </span>
                  ) : (
                    <span className="text-ink-400">—</span>
                  )}
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
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-500">
            Нема дизајни што одговараат на филтрите.
          </p>
        ) : null}
      </div>

      <CatalogPagination
        page={currentPage}
        totalItems={total}
        onPageChange={(nextPage) => navigate(buildHref({ page: nextPage }))}
        previousLabel="Претходна"
        nextLabel="Следна"
        pageLabel={(current, pages) => `${current} / ${pages}`}
      />

      {totalPages > 1 ? (
        <p className="text-center text-xs text-ink-400">
          Страница {currentPage} од {totalPages}
        </p>
      ) : null}
    </div>
  );
}
