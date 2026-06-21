'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crop, Upload } from 'lucide-react';
import { ImageCropModal } from '@/components/products/ImageCropModal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

type ProductPhotoUploadProps = {
  token: string | null;
  uploadLoading: boolean;
  uploadError: string | null;
  refreshSession: () => Promise<string | null>;
  hasPhoto: boolean;
  previewUrl?: string;
  onUploadComplete: (fileId: string, name: string, previewUrl: string) => void;
};

async function uploadBlob(
  token: string,
  blob: Blob,
  fileName: string,
  refreshSession: () => Promise<string | null>,
): Promise<{ fileId: string; originalName: string }> {
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('token', token);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();

  if (!res.ok) {
    if (
      data.error?.includes('Invalid or expired upload session') &&
      refreshSession
    ) {
      const newToken = await refreshSession();
      if (newToken) {
        return uploadBlob(newToken, blob, fileName, refreshSession);
      }
    }
    throw new Error(data.error || 'Upload failed');
  }

  return data;
}

export function ProductPhotoUpload({
  token,
  uploadLoading,
  uploadError,
  refreshSession,
  hasPhoto,
  previewUrl,
  onUploadComplete,
}: ProductPhotoUploadProps) {
  const t = useTranslations('products.customizer');
  const tc = useTranslations('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState('photo.jpg');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const isDisabled = uploadLoading || uploading || !token;

  function openFilePicker() {
    if (!isDisabled) fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    setPendingName(file.name.replace(/\.[^.]+$/, '') + '.jpg');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropSource(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  function openRecrop() {
    if (previewUrl) {
      setPendingName('photo-cropped.jpg');
      setCropSource(previewUrl);
    }
  }

  async function handleCropComplete(blob: Blob) {
    if (!token) {
      setMessage({ type: 'error', text: tc('uploadSessionError') });
      setCropSource(null);
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const result = await uploadBlob(
        token,
        blob,
        pendingName,
        refreshSession,
      );
      onUploadComplete(
        result.fileId,
        result.originalName,
        `/api/files/${result.fileId}`,
      );
      setMessage({ type: 'success', text: tc('uploadSuccess') });
      setCropSource(null);
    } catch {
      setMessage({ type: 'error', text: tc('uploadError') });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {uploadLoading ? (
        <LoadingIndicator label={tc('uploadPreparing')} size="sm" />
      ) : null}

      {!uploadLoading && uploadError ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600">{uploadError}</p>
          <p className="text-xs text-ink-500">{tc('uploadSessionHint')}</p>
          <button
            type="button"
            onClick={() => void refreshSession()}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {tc('uploadRetry')}
          </button>
        </div>
      ) : null}

      {uploading ? (
        <div className="flex items-center gap-2 text-sm text-ink-600">
          <Spinner size="sm" />
          {tc('loading')}
        </div>
      ) : null}

      {!hasPhoto ? (
        <>
          <p className="text-sm text-ink-600">{t('photoUploadInstructions')}</p>
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isDisabled}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-300 px-4 py-3 text-sm font-medium text-ink-600 transition hover:border-brand-500 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-50"
          >
            <Upload className="h-5 w-5" />
            {tc('chooseFile')}
          </button>
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={openRecrop}
            disabled={uploading || !previewUrl}
          >
            <Crop className="h-4 w-4" />
            {t('cropPhoto')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={openFilePicker}
            disabled={isDisabled}
          >
            {t('replacePhoto')}
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelected}
      />

      {message ? (
        <p
          className={`text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
        >
          {message.text}
        </p>
      ) : null}

      {cropSource ? (
        <ImageCropModal
          imageSrc={cropSource}
          onCancel={() => setCropSource(null)}
          onComplete={(blob) => void handleCropComplete(blob)}
        />
      ) : null}
    </div>
  );
}
