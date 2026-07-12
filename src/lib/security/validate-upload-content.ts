import sharp from 'sharp';

export async function validateUploadBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<void> {
  if (mimeType === 'application/pdf') {
    if (!buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
      throw new Error('Invalid PDF file');
    }
    return;
  }

  if (!mimeType.startsWith('image/')) {
    throw new Error('File type not allowed');
  }

  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.format) {
      throw new Error('Invalid image file');
    }

    const allowed = new Set(['jpeg', 'png', 'webp']);
    if (!allowed.has(meta.format)) {
      throw new Error('Image format not allowed');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('not allowed')) {
      throw error;
    }
    throw new Error('Invalid image file');
  }
}
