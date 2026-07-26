import type { SideDesign } from '@/lib/products/design-state';
import { buildUploadedFileUrl } from '@/lib/upload/file-url';

export interface PlacedPhoto {
  instanceId: string;
  fileId: string;
  name: string;
  previewUrl?: string;
  scale: number;
  position: { x: number; y: number };
}

export const MAX_PHOTOS_PER_SIDE = 3;

export const DEFAULT_PLACED_PHOTO_SCALE = 40;

export function createPlacedPhoto(
  fileId: string,
  name: string,
  previewUrl: string | undefined,
  existingCount: number,
): PlacedPhoto {
  const spread = existingCount % 4;
  return {
    instanceId: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileId,
    name,
    previewUrl,
    scale: DEFAULT_PLACED_PHOTO_SCALE,
    position: {
      x: 42 + spread * 6,
      y: 40 + spread * 5,
    },
  };
}

export function parsePlacedPhotos(value: unknown): PlacedPhoto[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is PlacedPhoto =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as PlacedPhoto).instanceId === 'string' &&
          typeof (item as PlacedPhoto).fileId === 'string' &&
          typeof (item as PlacedPhoto).name === 'string' &&
          typeof (item as PlacedPhoto).scale === 'number' &&
          typeof (item as PlacedPhoto).position === 'object' &&
          (item as PlacedPhoto).position !== null &&
          typeof (item as PlacedPhoto).position.x === 'number' &&
          typeof (item as PlacedPhoto).position.y === 'number',
      )
      .map((photo) => ({
        ...photo,
        previewUrl:
          typeof photo.previewUrl === 'string' ? photo.previewUrl : undefined,
      }));
  } catch {
    return [];
  }
}

export function serializePlacedPhotos(photos: PlacedPhoto[]): string {
  return JSON.stringify(photos);
}

/** Overlay templates may stash composite art in uploadedFile with an empty fileId. */
export function isOverlayTemplateUploadedFile(design: SideDesign): boolean {
  return Boolean(
    design.uploadedFile &&
      !design.uploadedFile.fileId?.trim() &&
      design.uploadedFile.previewUrl,
  );
}

export function getPlacedPhotos(design: SideDesign): PlacedPhoto[] {
  if (design.uploadedPhotos.length > 0) return design.uploadedPhotos;

  if (
    design.uploadedFile?.isImage &&
    design.uploadedFile.previewUrl &&
    design.uploadedFile.fileId?.trim()
  ) {
    return [
      {
        instanceId: `legacy-${design.uploadedFile.fileId}`,
        fileId: design.uploadedFile.fileId,
        name: design.uploadedFile.name,
        previewUrl: design.uploadedFile.previewUrl,
        scale: design.uploadedImageScale,
        position: { ...design.uploadedImagePosition },
      },
    ];
  }

  return [];
}

export function resolvePlacedPhotoPreviewUrl(
  photo: PlacedPhoto,
  uploadToken?: string | null,
): string | undefined {
  if (photo.previewUrl) return photo.previewUrl;
  const fileId = photo.fileId?.trim();
  if (!fileId) return undefined;
  return buildUploadedFileUrl(fileId, uploadToken);
}

export function hydratePlacedPhotoPreviewUrls(
  photos: PlacedPhoto[],
  uploadToken?: string | null,
): PlacedPhoto[] {
  if (photos.length === 0) return photos;
  let changed = false;
  const hydrated = photos.map((photo) => {
    const previewUrl = resolvePlacedPhotoPreviewUrl(photo, uploadToken);
    if (previewUrl === photo.previewUrl) return photo;
    changed = true;
    return { ...photo, previewUrl };
  });
  return changed ? hydrated : photos;
}

export function sideHasPremadeOverlayArtwork(design: SideDesign): boolean {
  return Boolean(
    design.overlaySvg ||
      design.overlayColorVariants ||
      design.overlayRaster ||
      design.isRecolorableOverlay,
  );
}

export function collectPlacedPhotoFileIds(design: SideDesign): string[] {
  return getPlacedPhotos(design)
    .map((photo) => photo.fileId)
    .filter((id) => id.trim().length > 0);
}

export function normalizeSideDesignPhotos(design: SideDesign): SideDesign {
  const migrated = getPlacedPhotos(design);
  if (migrated.length === 0) {
    return design.uploadedPhotos.length > 0
      ? { ...design, uploadedPhotos: [] }
      : design;
  }

  if (
    design.uploadedPhotos.length === migrated.length &&
    design.uploadedPhotos.every(
      (photo, index) => photo.instanceId === migrated[index]?.instanceId,
    )
  ) {
    return design;
  }

  return {
    ...design,
    uploadedPhotos: migrated,
    uploadedFile: isOverlayTemplateUploadedFile(design)
      ? design.uploadedFile
      : null,
  };
}
