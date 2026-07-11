import {
  PRODUCT_PHOTO_MIN_SCALE,
  PRODUCT_PRINT_AREA_MAX_SCALE,
} from '@/lib/products/customizer-constants';

export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function cropImageToBlob(
  imageSrc: string,
  crop: CropArea,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(crop.width);
  canvas.height = Math.round(crop.height);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  if (mimeType === 'image/png' || mimeType === 'image/webp') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Crop failed'));
      },
      mimeType,
      0.92,
    );
  });
}

export function clampPhotoScale(
  scale: number,
  max = PRODUCT_PRINT_AREA_MAX_SCALE,
): number {
  return Math.min(max, Math.max(PRODUCT_PHOTO_MIN_SCALE, Math.round(scale)));
}

export async function imageSrcToBlob(imageSrc: string): Promise<Blob> {
  const response = await fetch(imageSrc);
  return response.blob();
}
