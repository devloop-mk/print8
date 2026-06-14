import { nanoid } from 'nanoid';
import { db } from '../db';
import { supabaseAdmin } from '@/lib/supabase/client';
import sharp from 'sharp';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_UPLOADS_PER_SESSION = 10;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET!;

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

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('File type not allowed');
  }

  const fileId = nanoid();
  const ext = file.type === 'application/pdf' ? '.pdf' : '.webp';
  const storedName = `${fileId}${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  let buffer = Buffer.from(arrayBuffer) as unknown as Buffer;

  if (file.type.startsWith('image/')) {
    buffer = (await sharp(buffer)
      .rotate()
      .resize(4096, 4096, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()) as Buffer;
  }

  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(storedName, buffer, {
      contentType: file.type.startsWith('image/') ? 'image/webp' : file.type,
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
    mimeType: file.type.startsWith('image/') ? 'image/webp' : file.type,
    size: file.size,
    createdAt: now,
  });

  await db.uploadSessions.incrementUploadCount(session.id);

  return { fileId, originalName: file.name };
}

export async function getUploadedFile(fileId: string) {
  return db.uploadedFiles.findById(fileId);
}
