import { nanoid } from 'nanoid';
import { db } from '../db';
import { getSupabaseAdmin, formatSupabaseError } from '@/lib/supabase/client';
import sharp from 'sharp';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_UPLOADS_PER_SESSION = 10;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

function resolveMimeType(file: File): string {
  if (file.type && ALLOWED_MIME_TYPES.includes(file.type)) {
    return file.type;
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  const byExt: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };

  return byExt[ext ?? ''] ?? file.type;
}

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function getStorageBucket() {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error('Storage is not configured (SUPABASE_STORAGE_BUCKET)');
  }
  return bucket;
}

export async function createUploadSession(): Promise<{
  sessionId: string;
  token: string;
}> {
  const sessionId = nanoid();
  const token = nanoid(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  await db.uploadSessions.insert({
    id: sessionId,
    token,
    expiresAt: expiresAt.toISOString(),
    uploadCount: 0,
    createdAt: now.toISOString(),
  }).catch((err) => {
    throw new Error(formatSupabaseError(err));
  });

  return { sessionId, token };
}

export async function validateUploadToken(token: string) {
  return db.uploadSessions.findByToken(token);
}

export async function processUpload(
  token: string,
  file: File,
): Promise<{ fileId: string; originalName: string }> {
  const session = await validateUploadToken(token);
  if (!session) {
    throw new Error('Invalid or expired upload session');
  }

  if (session.uploadCount >= MAX_UPLOADS_PER_SESSION) {
    throw new Error('Upload limit reached for this session');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }

  const mimeType = resolveMimeType(file);
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('File type not allowed');
  }

  const fileId = nanoid();
  const ext = mimeType === 'application/pdf' ? '.pdf' : '.webp';
  const storedName = `${fileId}${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer) as unknown as Buffer;

  if (mimeType.startsWith('image/')) {
    buffer = (await sharp(buffer)
      .rotate()
      .resize(4096, 4096, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()) as Buffer;
  }

  const { error: uploadError } = await getSupabaseAdmin().storage
    .from(getStorageBucket())
    .upload(storedName, buffer, {
      contentType: mimeType.startsWith('image/') ? 'image/webp' : mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const now = new Date().toISOString();

  await db.uploadedFiles.insert({
    id: fileId,
    sessionId: session.id,
    originalName: file.name.slice(0, 255),
    storedName,
    mimeType: mimeType.startsWith('image/') ? 'image/webp' : mimeType,
    size: Math.max(0, Math.round(Number(file.size))),
    createdAt: now,
  }).catch((err) => {
    throw new Error(formatSupabaseError(err));
  });

  await db.uploadSessions.incrementUploadCount(session.id);

  return { fileId, originalName: file.name };
}

export async function getUploadedFile(fileId: string) {
  return db.uploadedFiles.findById(fileId);
}
