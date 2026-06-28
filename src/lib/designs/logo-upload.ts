const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_LOGO_DIMENSION = 512;

export async function readLogoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('invalid-type');
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error('too-large');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas-unavailable');
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('load-failed'));
    image.src = src;
  });
}
