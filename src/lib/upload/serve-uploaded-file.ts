import type { UploadedFileRecord } from '@/lib/db';
import {
  ensurePngBuffer,
  filenameWithMatchingExtension,
  sniffImageMime,
} from '@/lib/images/file-format';
import { getUploadObject } from '@/lib/storage/object-storage';

export type ServedUploadFile = {
  body: Buffer;
  contentType: string;
  filename: string;
};

async function loadStored(
  storedName: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  try {
    const stored = await getUploadObject(storedName);
    const sniffed = sniffImageMime(stored.body);
    return {
      body: stored.body,
      contentType: sniffed ?? stored.contentType ?? 'application/octet-stream',
    };
  } catch {
    return null;
  }
}

/**
 * Load an uploaded file for admin preview or download.
 * Downloads prefer the original bytes. WebP (preview or original) is converted
 * to PNG so Photoshop can open it — browsers open misnamed WebP, Photoshop does not.
 */
export async function serveUploadedFile(
  file: UploadedFileRecord,
  options: { preferOriginal: boolean },
): Promise<ServedUploadFile> {
  const candidates = options.preferOriginal
    ? [file.originalStoredName, file.storedName]
    : [file.storedName, file.originalStoredName];

  let loaded: { body: Buffer; contentType: string } | null = null;
  for (const name of candidates) {
    if (!name) continue;
    loaded = await loadStored(name);
    if (loaded) break;
  }

  if (!loaded) {
    throw new Error('Upload object missing');
  }

  let { body, contentType } = loaded;

  if (options.preferOriginal && contentType === 'image/webp') {
    body = await ensurePngBuffer(body);
    contentType = 'image/png';
  }

  return {
    body,
    contentType,
    filename: filenameWithMatchingExtension(file.originalName, contentType),
  };
}
