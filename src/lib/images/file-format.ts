import sharp from 'sharp';

export type SniffedImageMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'application/pdf';

/** Detect real file type from magic bytes, ignoring the filename. */
export function sniffImageMime(buffer: Buffer): SniffedImageMime | null {
  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  return null;
}

export function extensionForMime(mimeType: string): string {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'application/pdf') return '.pdf';
  return '';
}

export function filenameWithMatchingExtension(
  originalName: string,
  mimeType: string,
): string {
  const trimmed = originalName.trim() || 'file';
  const base = trimmed.replace(/\.[^.]+$/, '') || 'file';
  const ext = extensionForMime(mimeType);
  return ext ? `${base}${ext}` : trimmed;
}

/** Re-encode as a standard PNG Photoshop can open (WebP/JPEG labeled as PNG, etc.). */
export async function ensurePngBuffer(buffer: Buffer): Promise<Buffer> {
  if (sniffImageMime(buffer) === 'image/png') {
    return buffer;
  }
  return (await sharp(buffer).rotate().png({ compressionLevel: 6 }).toBuffer()) as Buffer;
}
