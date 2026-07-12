import { buildUploadedFileUrl } from '@/lib/upload/file-url';

export const STUDIO_IMAGE_FILE_ID_KEY = 'print8FileId';

type FabricObjectLike = {
  type?: string;
  toDataURL?: (options?: {
    format?: string;
    quality?: number;
    multiplier?: number;
  }) => string;
};

type CanvasJson = {
  objects?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

function isImageType(type: unknown) {
  return String(type ?? '').toLowerCase() === 'image';
}

export function extractFileIdFromUploadUrl(src: string): string | null {
  const match = src.match(/\/api\/files\/([^?]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function embedImageDataUrls(
  json: CanvasJson,
  liveObjects: FabricObjectLike[],
) {
  if (!Array.isArray(json.objects)) return;

  json.objects.forEach((objectJson, index) => {
    if (!isImageType(objectJson.type)) return;

    const liveObject = liveObjects[index];
    const src = typeof objectJson.src === 'string' ? objectJson.src : '';
    const fileId =
      extractFileIdFromUploadUrl(src) ??
      (typeof (liveObject as Record<string, unknown> | undefined)?.[
        STUDIO_IMAGE_FILE_ID_KEY
      ] === 'string'
        ? String((liveObject as Record<string, unknown>)[STUDIO_IMAGE_FILE_ID_KEY])
        : typeof objectJson[STUDIO_IMAGE_FILE_ID_KEY] === 'string'
          ? objectJson[STUDIO_IMAGE_FILE_ID_KEY]
          : null);

    if (fileId) {
      objectJson[STUDIO_IMAGE_FILE_ID_KEY] = fileId;
    }

    if (liveObject && isImageType(liveObject.type) && liveObject.toDataURL) {
      try {
        objectJson.src = liveObject.toDataURL({
          format: 'jpeg',
          quality: 0.9,
          multiplier: 1,
        });
      } catch {
        // Keep existing src if rasterization fails.
      }
    }
  });
}

export function serializeStudioCanvasJson(
  json: CanvasJson,
  liveObjects: FabricObjectLike[],
): CanvasJson {
  const serialized = structuredClone(json) as CanvasJson;
  embedImageDataUrls(serialized, liveObjects);
  return serialized;
}

export function prepareStudioCanvasJsonForRestore(
  json: CanvasJson,
  uploadToken?: string | null,
): CanvasJson {
  const prepared = structuredClone(json) as CanvasJson;
  if (!Array.isArray(prepared.objects)) return prepared;

  for (const objectJson of prepared.objects) {
    if (!isImageType(objectJson.type)) continue;

    const src = typeof objectJson.src === 'string' ? objectJson.src : '';
    if (src.startsWith('data:')) continue;

    const storedFileId =
      typeof objectJson[STUDIO_IMAGE_FILE_ID_KEY] === 'string'
        ? objectJson[STUDIO_IMAGE_FILE_ID_KEY]
        : extractFileIdFromUploadUrl(src);

    if (storedFileId) {
      objectJson[STUDIO_IMAGE_FILE_ID_KEY] = storedFileId;
      objectJson.src = buildUploadedFileUrl(storedFileId, uploadToken);
    }
  }

  return prepared;
}

export function draftNeedsUploadToken(json: CanvasJson) {
  return (json.objects ?? []).some((objectJson) => {
    if (!isImageType(objectJson.type)) return false;
    const src = typeof objectJson.src === 'string' ? objectJson.src : '';
    return src.length > 0 && !src.startsWith('data:');
  });
}
