import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { catalogStoragePath, putCatalogObject } from '@/lib/storage/object-storage';
import { isR2Configured } from '@/lib/storage/r2-client';

const MAX_FILE_SIZE = 12 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
]);

function sanitizeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\/+|\/+$/g, '');
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'Cloudflare R2 is not configured for catalog uploads' },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folder = sanitizeSegment(String(formData.get('folder') ?? 'admin'));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const mimeType = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    const sourceBuffer = Buffer.from(await file.arrayBuffer());
    let relativePath: string;
    let contentType: string;
    let body: Buffer;

    if (mimeType === 'image/svg+xml') {
      const baseName = file.name.replace(/\.[^.]+$/, '') || nanoid(8);
      relativePath = `NEW_DESIGNS/${folder}/${baseName}.svg`;
      body = sourceBuffer;
      contentType = 'image/svg+xml';
    } else {
      const id = nanoid(10);
      relativePath = `NEW_DESIGNS/${folder}/${id}.webp`;
      body = (await sharp(sourceBuffer)
        .rotate()
        .resize(2400, 2400, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer()) as Buffer;
      contentType = 'image/webp';
    }

    await putCatalogObject(relativePath, body, contentType);

    return NextResponse.json({
      path: catalogStoragePath(relativePath),
      storageKey: `catalog/${relativePath}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
