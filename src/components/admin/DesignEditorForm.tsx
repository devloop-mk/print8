'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { CatalogDesignRecord } from '@/lib/db/catalog-designs';
import {
  DESIGN_AVAILABILITY_OPTIONS,
  DESIGN_CATEGORY_OPTIONS,
} from '@/lib/admin/designs';
import { Button } from '@/components/ui/Button';
import { AdminAssetUploader } from '@/components/admin/AdminAssetUploader';
import { resolveAssetUrl } from '@/lib/storage/asset-url';

type DesignEditorFormProps = {
  design: CatalogDesignRecord;
};

export function DesignEditorForm({ design }: DesignEditorFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    category: design.category,
    kind: design.kind,
    image: design.image,
    tags: design.tags.join(', '),
    thumbAspect: design.thumbAspect?.toString() ?? '1.75',
    exclusive: design.exclusive,
    availability: design.availability,
    price: design.price?.toString() ?? '',
    sortOrder: design.sortOrder.toString(),
    nameEn: design.nameEn,
    nameMk: design.nameMk,
    descriptionEn: design.descriptionEn ?? '',
    descriptionMk: design.descriptionMk ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/designs/${design.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          kind: form.kind,
          image: form.image,
          tags: form.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
          thumbAspect: form.thumbAspect ? Number(form.thumbAspect) : null,
          exclusive: form.exclusive,
          availability: form.availability,
          price: form.price ? Number(form.price) : null,
          sortOrder: Number(form.sortOrder) || 0,
          nameEn: form.nameEn,
          nameMk: form.nameMk,
          descriptionEn: form.descriptionEn || null,
          descriptionMk: form.descriptionMk || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to save design');
      }

      setMessage('Промените се зачувани.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save design');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
          <div className="relative aspect-[1.75/1] bg-ink-50">
            <Image
              src={resolveAssetUrl(form.image)}
              alt={form.nameMk}
              fill
              sizes="280px"
              className="object-contain p-3"
            />
          </div>
        </div>
        <div className="rounded-xl border border-ink-200 bg-white p-4 text-sm text-ink-600">
          <p>
            <span className="font-medium text-ink-800">ID:</span> {design.id}
          </p>
          {design.reservedOrderId ? (
            <p className="mt-2">
              <span className="font-medium text-ink-800">Резервација:</span>{' '}
              <a
                href={`/admin/orders/${design.reservedOrderId}`}
                className="text-brand-700 hover:underline"
              >
                {design.reservedOrderId}
              </a>
            </p>
          ) : null}
          {design.soldOrderId ? (
            <p className="mt-2">
              <span className="font-medium text-ink-800">Продадено во:</span>{' '}
              <a
                href={`/admin/orders/${design.soldOrderId}`}
                className="text-brand-700 hover:underline"
              >
                {design.soldOrderId}
              </a>
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-5 rounded-xl border border-ink-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-ink-700">Име (MK)</span>
            <input
              value={form.nameMk}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nameMk: event.target.value }))
              }
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-ink-700">Име (EN)</span>
            <input
              value={form.nameEn}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, nameEn: event.target.value }))
              }
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">Категорија</span>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  category: event.target.value as typeof form.category,
                }))
              }
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
            >
              {DESIGN_CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">Статус</span>
            <select
              value={form.availability}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  availability: event.target.value as typeof form.availability,
                }))
              }
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
            >
              {DESIGN_AVAILABILITY_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-ink-700">Слика (URL)</span>
            <input
              value={form.image}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, image: event.target.value }))
              }
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
              required
            />
            <div className="mt-2">
              <AdminAssetUploader
                folder={`business-cards/${design.id}`}
                onUploaded={(path) =>
                  setForm((prev) => ({ ...prev, image: path }))
                }
              />
            </div>
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-ink-700">Тагови</span>
            <input
              value={form.tags}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, tags: event.target.value }))
              }
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
              placeholder="creative, corporate, photography"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">Цена (ден.)</span>
            <input
              type="number"
              value={form.price}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, price: event.target.value }))
              }
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
              placeholder="500"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">Редослед</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sortOrder: event.target.value }))
              }
              className="w-full rounded-lg border border-ink-200 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.exclusive}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, exclusive: event.target.checked }))
              }
            />
            Ексклузивен дизајн (се продава само еднаш)
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink-700">Опис (MK)</span>
          <textarea
            value={form.descriptionMk}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, descriptionMk: event.target.value }))
            }
            rows={3}
            className="w-full rounded-lg border border-ink-200 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-ink-700">Опис (EN)</span>
          <textarea
            value={form.descriptionEn}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, descriptionEn: event.target.value }))
            }
            rows={3}
            className="w-full rounded-lg border border-ink-200 px-3 py-2"
          />
        </label>

        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Се зачувува…' : 'Зачувај промени'}
          </Button>
        </div>
      </div>
    </form>
  );
}
