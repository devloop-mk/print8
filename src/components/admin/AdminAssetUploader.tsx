'use client';

import { useState } from 'react';

export function AdminAssetUploader({
  folder,
  onUploaded,
}: {
  folder: string;
  onUploaded: (path: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/admin/assets/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error ?? 'Upload failed');
      }

      onUploaded(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-1">
      <label className="inline-flex cursor-pointer items-center rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-ink-50">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          className="hidden"
          disabled={uploading}
          onChange={handleChange}
        />
        {uploading ? 'Се прикачува…' : 'Прикачи во R2'}
      </label>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
