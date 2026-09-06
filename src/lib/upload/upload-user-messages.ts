import { MAX_FILE_SIZE } from '@/lib/upload/constants';
import { formatBytes } from '@/lib/students/student-print-config';

export type UploadUserMessageFns = {
  uploadError: () => string;
  uploadLimit: () => string;
  uploadSessionError: () => string;
  uploadTooLarge: (values: { max: string }) => string;
  uploadTypeNotAllowed: () => string;
  uploadTurnstileFailed: () => string;
};

const DEFAULT_MAX_LABEL = formatBytes(MAX_FILE_SIZE);

/** Map API / client upload error codes to customer-facing copy. */
export function resolveUploadUserMessage(
  error: string | null | undefined,
  t: UploadUserMessageFns,
  options?: { maxSizeLabel?: string },
): string | null {
  if (!error) return null;

  const max = options?.maxSizeLabel ?? DEFAULT_MAX_LABEL;
  const normalized = error.trim().toLowerCase();

  if (error === 'UPLOAD_LIMIT_REACHED' || normalized.includes('upload limit')) {
    return t.uploadLimit();
  }

  if (normalized.includes('file too large')) {
    return t.uploadTooLarge({ max });
  }

  if (
    normalized.includes('file type not allowed') ||
    normalized.includes('image format not allowed') ||
    normalized.includes('print uploads must be png')
  ) {
    return t.uploadTypeNotAllowed();
  }

  if (
    normalized.includes('invalid or expired upload session') ||
    normalized.includes('failed to create upload session') ||
    normalized.includes('upload token')
  ) {
    return t.uploadSessionError();
  }

  if (
    normalized.includes('human verification failed') ||
    normalized.includes('turnstile') ||
    normalized.includes('security check')
  ) {
    return t.uploadTurnstileFailed();
  }

  if (/[\u0400-\u04FF]/.test(error)) {
    return error;
  }

  if (
    normalized.includes('upload failed') ||
    normalized.includes('method not allowed') ||
    normalized.includes('network') ||
    normalized.includes('fetch')
  ) {
    return t.uploadError();
  }

  return t.uploadError();
}

export function uploadMessageFns(
  t: (key: string, values?: Record<string, string | number>) => string,
): UploadUserMessageFns {
  return {
    uploadError: () => t('uploadError'),
    uploadLimit: () => t('uploadLimit'),
    uploadSessionError: () => t('uploadSessionError'),
    uploadTooLarge: (values) => t('uploadTooLarge', values),
    uploadTypeNotAllowed: () => t('uploadTypeNotAllowed'),
    uploadTurnstileFailed: () => t('uploadTurnstileFailed'),
  };
}
