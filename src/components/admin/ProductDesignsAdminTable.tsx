'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type {
  AdminProductDesignListPage,
  AdminProductDesignStorage,
} from '@/lib/admin/product-designs-shared';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { cn } from '@/lib/utils';
import {
  clampCatalogPage,
  getCatalogPageCount,
} from '@/lib/catalog/pagination';

export function ProductDesignsAdminTable({
  initialResult,
  initialSearch,
  initialStorage,
}: {
  initialResult: AdminProductDesignListPage;
  initialSearch: string;
  initialStorage: AdminProductDesignStorage;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { items, total, page, pageSize, inDatabaseCount, codeOnlyCount } =
    initialResult;

  function buildHref(patch: {
    page?: number;
    q?: string;
    storage?: AdminProductDesignStorage;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextPage = patch.page ?? page;
    const nextSearch = patch.q ?? initialSearch;
    const nextStorage = patch.storage ?? initialStorage;

    if (nextSearch.trim()) params.set('q', nextSearch.trim());
    else params.delete('q');

    if (nextStorage !== 'all') params.set('storage', nextStorage);
    else params.delete('storage');

    if (nextPage <= 1) params.delete('page');
    else params.set('page', String(nextPage));

    const query = params.toString();
    return query ? `/admin/product-designs?${query}` : '/admin/product-designs';
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
    ) as AdminProductDesignStorage;
    navigate(buildHref({ page: 1, q, storage }));
  }

  async function handleImportAll() {
    if (
      !confirm(
        `Да се импортираат сите дизајни од кодот во база?\n\n` +
          `Ќе се додадат ${codeOnlyCount} што сè уште не се во база. ` +
          `Постоечките записи нема да се презапишат.`,
      )
    ) {
      return;
    }

    setImporting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/product-designs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwrite: false }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? 'Import failed');
      }
      setMessage(
        `Импортирани ${data.imported} дизајни. Прескокнати ${data.skipped} (веќе во база).`,
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  const totalPages = getCatalogPageCount(total, pageSize);
  const currentPage = clampCatalogPage(page, total, pageSize);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ink-200 bg-white p-4 text-sm text-ink-600">
        <p>
          <span className="font-medium text-ink-800">Во база:</span>{' '}
          {inDatabaseCount} ·{' '}
          <span className="font-medium text-ink-800">Само во код:</span>{' '}
          {codeOnlyCount}
        </p>
        {codeOnlyCount > 0 ? (
          <p className="mt-2 text-ink-500">
            Дизајните од кодот се уште не се во база додека не ги уредите или
            не кликнете „Импортирај ги сите во база“.
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <label className="flex-1 text-sm">
            <span className="mb-1 block font-medium text-ink-700">Пребарај</span>
            <input
              name="q"
              defaultValue={initialSearch}
              placeholder="ID, име, тип…"
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
            />
          </label>
          <label className="text-sm sm:w-56">
            <span className="mb-1 block font-medium text-ink-700">Локација</span>
            <select
              name="storage"
              defaultValue={initialStorage}
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
            >
              <option value="all">Сите</option>
              <option value="database">Во база</option>
              <option value="code-only">Само во код</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 sm:self-end"
          >
            Филтрирај
          </button>
        </div>
        <div className="flex flex-wrap gap-2 sm:self-end">
          {codeOnlyCount > 0 ? (
            <button
              type="button"
              onClick={() => void handleImportAll()}
              disabled={importing || isPending}
              className="rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-60"
            >
              {importing ? 'Се импортира…' : 'Импортирај ги сите во база'}
            </button>
          ) : null}
          <Link
            href="/admin/product-designs/new"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            + Нов дизајн
          </Link>
        </div>
      </form>

      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div
        className={cn(
          'overflow-x-auto rounded-xl border border-ink-200 bg-white',
          isPending && 'opacity-60',
        )}
      >
        <table className="min-w-full divide-y divide-ink-100 text-sm">
          <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Дизајн</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Производи</th>
              <th className="px-4 py-3">Бои</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((design) => (
              <tr key={design.id} className="hover:bg-ink-50/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{design.title}</p>
                  <p className="text-xs text-ink-500">{design.id}</p>
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {design.kind} · {design.category}
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {design.productTypes.join(', ')}
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {design.applicableColorCount > 0
                    ? `${design.applicableColorCount} избрани`
                    : design.variantColorCount > 0
                      ? `${design.variantColorCount} variants`
                      : 'авто'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      design.active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800',
                    )}
                  >
                    {design.active ? 'Активен' : 'Скриен'}
                  </span>
                  {design.inDatabase ? (
                    <span className="ml-2 inline-flex rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">
                      Во база
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Само во код
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/product-designs/${design.id}`}
                    className="font-medium text-brand-700 hover:underline"
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
            Нема дизајни што одговараат на филтерот.
          </p>
        ) : null}

        <div className="px-4 pb-4">
          <CatalogPagination
            page={currentPage}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={(nextPage) => navigate(buildHref({ page: nextPage }))}
            previousLabel="Претходна"
            nextLabel="Следна"
            pageLabel={(current, pages) => `Страница ${current} од ${pages}`}
          />
        </div>
      </div>

      <p className="text-xs text-ink-500">
        Прикажани {(currentPage - 1) * pageSize + (items.length ? 1 : 0)}–
        {(currentPage - 1) * pageSize + items.length} од {total} дизајни
        {totalPages > 1 ? ` · страница ${currentPage} од ${totalPages}` : ''}
      </p>
    </div>
  );
}
