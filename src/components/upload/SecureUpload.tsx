'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface SecureUploadProps {
  token: string | null;
  onUpload: (fileId: string, originalName: string) => void;
  disabled?: boolean;
}

export function SecureUpload({ token, onUpload, disabled }: SecureUploadProps) {
  const t = useTranslations('common');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('token', token);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error('UPLOAD_LIMIT_REACHED');
        }
        throw new Error(data.error || 'Upload failed');
      }

      onUpload(data.fileId, data.originalName);
      setMessage({ type: 'success', text: t('uploadSuccess') });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '';
      const errorText =
        errorMsg === 'UPLOAD_LIMIT_REACHED'
          ? t('uploadLimit')
          : t('uploadError');
      setMessage({ type: 'error', text: errorText });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-ink-300 px-4 py-3 text-sm text-ink-600 transition hover:border-brand-500 hover:text-brand-600 ${disabled || !token || uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        {uploading ? t('loading') : 'Choose file'}
        <input
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleChange}
          disabled={disabled || !token || uploading}
        />
      </label>
      {message && (
        <p
          className={`mt-2 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
