'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/Spinner';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

interface SecureUploadProps {
  token: string | null;
  loading?: boolean;
  sessionError?: string | null;
  pendingTurnstile?: boolean;
  onRefreshSession?: () => Promise<string | null>;
  onUpload: (fileId: string, originalName: string) => void;
  disabled?: boolean;
}

export function SecureUpload({
  token,
  loading = false,
  sessionError = null,
  pendingTurnstile = false,
  onRefreshSession,
  onUpload,
  disabled,
}: SecureUploadProps) {
  const t = useTranslations('common');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const isDisabled = disabled || loading || uploading;
  const canUpload = Boolean(token) && !isDisabled;

  async function uploadWithToken(uploadToken: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('token', uploadToken);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('UPLOAD_LIMIT_REACHED');
      }
      if (
        data.error?.includes('Invalid or expired upload session') &&
        onRefreshSession
      ) {
        const newToken = await onRefreshSession();
        if (newToken) {
          return uploadWithToken(newToken, file);
        }
      }
      throw new Error(data.error || 'Upload failed');
    }

    return data as { fileId: string; originalName: string };
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!token) {
      setMessage({ type: 'error', text: t('uploadSessionError') });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const result = await uploadWithToken(token, file);
      onUpload(result.fileId, result.originalName);
      setMessage({ type: 'success', text: t('uploadSuccess') });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '';
      const errorText =
        errorMsg === 'UPLOAD_LIMIT_REACHED'
          ? t('uploadLimit')
          : errorMsg || t('uploadError');
      setMessage({ type: 'error', text: errorText });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      {loading ? (
        <div className="mb-3">
          <LoadingIndicator label={t('uploadPreparing')} size="sm" />
        </div>
      ) : null}

      {!loading && sessionError && (
        <div className="mb-3 space-y-2">
          <p className="text-sm text-red-600">{sessionError}</p>
          <p className="text-xs text-ink-500">{t('uploadSessionHint')}</p>
          {onRefreshSession && (
            <button
              type="button"
              onClick={() => void onRefreshSession()}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {t('uploadRetry')}
            </button>
          )}
        </div>
      )}

      {pendingTurnstile ? (
        <p className="mb-3 text-sm text-ink-600">{t('uploadTurnstileHint')}</p>
      ) : null}

      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-ink-300 px-4 py-3 text-sm text-ink-600 transition hover:border-brand-500 hover:text-brand-600 ${!canUpload ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        {uploading ? (
          <Spinner size="sm" />
        ) : (
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
        )}
        {uploading ? t('loading') : t('chooseFile')}
        <input
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleChange}
          disabled={!canUpload}
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
