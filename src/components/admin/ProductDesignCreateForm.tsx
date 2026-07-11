'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createEmptyProductDesignTemplate } from '@/lib/admin/product-designs-shared';
import { Button } from '@/components/ui/Button';

export function ProductDesignCreateForm() {
  const router = useRouter();
  const [id, setId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = id.trim();
    if (!trimmed) return;

    setCreating(true);
    setError(null);

    try {
      const template = createEmptyProductDesignTemplate(trimmed);
      const response = await fetch('/api/admin/product-designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: trimmed,
          template,
          active: true,
          sortOrder: 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to create design');
      }

      router.push(`/admin/product-designs/${trimmed}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleCreate} className="max-w-lg space-y-4 rounded-xl border border-ink-200 bg-white p-5">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-ink-700">ID на дизајнот</span>
        <input
          value={id}
          onChange={(event) => setId(event.target.value)}
          placeholder="tee-print-my-design"
          className="w-full rounded-lg border border-ink-200 px-3 py-2"
          required
        />
        <span className="mt-1 block text-xs text-ink-500">
          Користете мали букви, цртички и бројки. Пример: tee-print-summer-vibes
        </span>
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" disabled={creating}>
        {creating ? 'Се создава…' : 'Создај и уреди'}
      </Button>
    </form>
  );
}
