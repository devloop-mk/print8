'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, Upload } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import {
  STUDENT_PRINT_MAX_FILE_SIZE,
  formatBytes,
} from '@/lib/students/student-print-config';
import { countPdfPages, isPdfFile } from '@/lib/students/count-pdf-pages';
import type { StudentPrintUploadedFile } from '@/lib/students/student-print-state';

interface StudentPrintPdfUploadProps {
  token: string | null;
  loading?: boolean;
  sessionError?: string | null;
  onRefreshSession?: () => Promise<string | null>;
  disabled?: boolean;
  value: StudentPrintUploadedFile | null;
  onChange: (file: StudentPrintUploadedFile | null) => void;
}

export function StudentPrintPdfUpload({
  token,
  loading = false,
  sessionError = null,
  onRefreshSession,
  disabled,
  value,
  onChange,
}: StudentPrintPdfUploadProps) {
  const t = useTranslations('students.print');
  const tc = useTranslations('common');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const isDisabled = disabled || loading || uploading;
  const canUpload = Boolean(token) && !isDisabled;
  const maxSizeLabel = formatBytes(STUDENT_PRINT_MAX_FILE_SIZE);

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
      setMessage({ type: 'error', text: tc('uploadSessionError') });
      return;
    }

    if (!isPdfFile(file)) {
      setMessage({ type: 'error', text: t('uploadPdfOnly') });
      e.target.value = '';
      return;
    }

    if (file.size > STUDENT_PRINT_MAX_FILE_SIZE) {
      setMessage({
        type: 'error',
        text: t('uploadTooLarge', { max: maxSizeLabel }),
      });
      e.target.value = '';
      return;
    }

    setUploading(true);
    setMessage(null);
    onChange(null);

    try {
      const pageCount = await countPdfPages(file);
      if (pageCount < 1) {
        throw new Error(t('uploadPageCountFailed'));
      }

      const result = await uploadWithToken(token, file);
      onChange({
        fileId: result.fileId,
        originalName: result.originalName,
        pageCount,
        fileSize: file.size,
      });
      setMessage({ type: 'success', text: tc('uploadSuccess') });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '';
      const errorText =
        errorMsg === 'UPLOAD_LIMIT_REACHED'
          ? tc('uploadLimit')
          : errorMsg || tc('uploadError');
      setMessage({ type: 'error', text: errorText });
      onChange(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleRemove() {
    onChange(null);
    setMessage(null);
  }

  return (
    <div>
      {loading ? (
        <div className="mb-3">
          <LoadingIndicator label={tc('uploadPreparing')} size="sm" />
        </div>
      ) : null}

      {!loading && sessionError && (
        <div className="mb-3 space-y-2">
          <p className="text-sm text-red-600">{sessionError}</p>
          <p className="text-xs text-ink-500">{tc('uploadSessionHint')}</p>
          {onRefreshSession && (
            <button
              type="button"
              onClick={() => void onRefreshSession()}
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {tc('uploadRetry')}
            </button>
          )}
        </div>
      )}

      <p className="mb-3 text-sm text-ink-500">
        {t('uploadHint', { max: maxSizeLabel })}
      </p>

      {value ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2 text-brand-600 shadow-sm">
              <FileText className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink-900">
                {value.originalName}
              </p>
              <p className="mt-1 text-sm text-ink-600">
                {t('uploadSummary', {
                  pages: value.pageCount,
                  size: formatBytes(value.fileSize),
                })}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
            >
              {t('uploadRemove')}
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-ink-300 px-6 py-8 text-center text-sm text-ink-600 transition hover:border-brand-500 hover:text-brand-600 ${!canUpload ? 'pointer-events-none opacity-50' : ''}`}
        >
          {uploading ? (
            <Spinner size="md" />
          ) : (
            <Upload className="h-8 w-8 text-ink-400" aria-hidden />
          )}
          <span className="font-medium">
            {uploading ? t('uploadAnalyzing') : t('uploadCta')}
          </span>
          <span className="text-xs text-ink-500">{t('uploadFormats')}</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,application/pdf"
            onChange={handleChange}
            disabled={!canUpload}
          />
        </label>
      )}

      {message && (
        <p
          className={`mt-3 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
