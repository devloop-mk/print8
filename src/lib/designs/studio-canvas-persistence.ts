import { buildUploadedFileUrl } from '@/lib/upload/file-url';

export const STUDIO_IMAGE_FILE_ID_KEY = 'print8FileId';

type CanvasJson = {
  objects?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

function readLiveObjectType(object: unknown): string | undefined {
  if (!object || typeof object !== 'object') return undefined;
  const type = (object as { type?: unknown }).type;
  return typeof type === 'string' ? type : undefined;
}

function rasterizeLiveImageObject(object: unknown): string | null {
  if (!object || typeof object !== 'object') return null;
  const toDataURL = (object as { toDataURL?: unknown }).toDataURL;
  if (typeof toDataURL !== 'function') return null;

  try {
    return (toDataURL as (options?: object) => string).call(object, {
      format: 'jpeg',
      quality: 0.9,
      multiplier: 1,
    });
  } catch {
    return null;
  }
}

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

function embedImageDataUrls(json: CanvasJson, liveObjects: unknown[]) {
  if (!Array.isArray(json.objects)) return;

  json.objects.forEach((objectJson, index) => {
    if (!isImageType(objectJson.type)) return;

    const liveObject = liveObjects[index];
    const liveType = readLiveObjectType(liveObject);
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

    if (liveObject && isImageType(liveType)) {
      const dataUrl = rasterizeLiveImageObject(liveObject);
      if (dataUrl) {
        objectJson.src = dataUrl;
      }
    }
  });
}

export function serializeStudioCanvasJson(
  json: CanvasJson,
  liveObjects: unknown[],
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
