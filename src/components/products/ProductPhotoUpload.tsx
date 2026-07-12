'use client';

import { useRef, useState } from 'react';
import { buildUploadedFileUrl } from '@/lib/upload/file-url';
import { useTranslations } from 'next-intl';
import { Crop, Upload } from 'lucide-react';
import { ImageCropModal } from '@/components/products/ImageCropModal';
import { imageSrcToBlob } from '@/lib/products/crop-image';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';

type ProductPhotoUploadProps = {
  token: string | null;
  uploadLoading: boolean;
  uploadError: string | null;
  refreshSession: () => Promise<string | null>;
  hasPhoto: boolean;
  previewUrl?: string;
  cropAspect?: number;
  /** Upload the file as-is (keeps PNG transparency). Skips the crop step. */
  skipCrop?: boolean;
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
  cropAspect,
  skipCrop = false,
  onUploadComplete,
}: ProductPhotoUploadProps) {
  const t = useTranslations('products.customizer');
  const tc = useTranslations('common');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingName, setPendingName] = useState('photo.jpg');
  const [message, setMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  const isDisabled = uploadLoading || uploading || Boolean(cropSource) || !token;

  function openFilePicker() {
    if (!isDisabled) fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;

    if (skipCrop && token) {
      void uploadFileDirect(file);
      return;
    }

    setPendingFile(file);
    const ext = file.name.match(/\.[^.]+$/)?.[0] ?? '.jpg';
    setPendingName(file.name.replace(/\.[^.]+$/, '') + ext);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropSource(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function uploadFileDirect(file: File) {
    if (!token) {
      setMessage({ type: 'error', text: tc('uploadSessionError') });
      return;
    }

    setMessage(null);
    setUploading(true);
    try {
      const result = await uploadBlob(token, file, file.name, refreshSession);
      onUploadComplete(
        result.fileId,
        result.originalName,
        buildUploadedFileUrl(result.fileId, token),
      );
      setMessage({ type: 'success', text: tc('uploadSuccess') });
    } catch {
      setMessage({ type: 'error', text: tc('uploadError') });
    } finally {
      setUploading(false);
    }
  }

  function openRecrop() {
    if (previewUrl) {
      setPendingFile(null);
      setPendingName('photo-cropped.jpg');
      setCropSource(previewUrl);
    }
  }

  function resolveOutputMimeType():
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp' {
    if (pendingFile?.type === 'image/png') return 'image/png';
    if (pendingFile?.type === 'image/webp') return 'image/webp';
    if (cropSource?.startsWith('data:image/png')) return 'image/png';
    if (cropSource?.startsWith('data:image/webp')) return 'image/webp';
    return 'image/jpeg';
  }

  async function handleUseOriginal() {
    if (!token || !cropSource) {
      setMessage({ type: 'error', text: tc('uploadSessionError') });
      throw new Error('No upload session');
    }

    setMessage(null);
    setUploading(true);
    try {
      const blob = pendingFile ?? (await imageSrcToBlob(cropSource));
      const fileName = pendingFile?.name ?? pendingName;
      const result = await uploadBlob(token, blob, fileName, refreshSession);
      onUploadComplete(
        result.fileId,
        result.originalName,
        buildUploadedFileUrl(result.fileId, token),
      );
      setMessage({ type: 'success', text: tc('uploadSuccess') });
      setCropSource(null);
      setPendingFile(null);
    } catch {
      setMessage({ type: 'error', text: tc('uploadError') });
      throw new Error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleCropComplete(blob: Blob) {
    if (!token) {
      setMessage({ type: 'error', text: tc('uploadSessionError') });
      setCropSource(null);
      throw new Error('No upload session');
    }

    setMessage(null);
    setUploading(true);
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
        buildUploadedFileUrl(result.fileId, token),
      );
      setMessage({ type: 'success', text: tc('uploadSuccess') });
      setCropSource(null);
      setPendingFile(null);
    } catch {
      setMessage({ type: 'error', text: tc('uploadError') });
      throw new Error('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {uploadLoading || uploading ? (
        <LoadingIndicator
          label={uploading ? t('cropUploading') : tc('uploadPreparing')}
          size="sm"
        />
      ) : null}

      {!uploadLoading && !uploading && uploadError ? (
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
            disabled={Boolean(cropSource) || !previewUrl}
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
          aspect={cropAspect}
          outputMimeType={resolveOutputMimeType()}
          onCancel={() => {
            setCropSource(null);
            setPendingFile(null);
          }}
          onComplete={handleCropComplete}
          onUseOriginal={handleUseOriginal}
        />
      ) : null}
    </div>
  );
}
