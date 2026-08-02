import { nanoid } from 'nanoid';
import { db } from '../db';
import { formatSupabaseError } from '@/lib/supabase/client';
import { putUploadObject } from '@/lib/storage/object-storage';
import { validateUploadBuffer } from '@/lib/security/validate-upload-content';
import sharp from 'sharp';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_PRINT_FILE_SIZE,
  MAX_UPLOADS_PER_SESSION,
} from '@/lib/upload/constants';

export {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_PRINT_FILE_SIZE,
  MAX_UPLOADS_PER_SESSION,
} from '@/lib/upload/constants';

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

function extensionForMime(mimeType: string) {
  if (mimeType === 'image/jpeg') return '.jpg';
  if (mimeType === 'image/png') return '.png';
  if (mimeType === 'image/webp') return '.webp';
  if (mimeType === 'application/pdf') return '.pdf';
  return '';
}

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

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

  if (new Date(session.expiresAt).getTime() < Date.now()) {
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
  const arrayBuffer = await file.arrayBuffer();
  const sourceBuffer = Buffer.from(arrayBuffer) as unknown as Buffer;

  await validateUploadBuffer(sourceBuffer, mimeType);

  let storedName: string;
  let originalStoredName: string | null = null;
  let storedMimeType = mimeType;

  if (mimeType.startsWith('image/')) {
    const ext = extensionForMime(mimeType);
    originalStoredName = `${fileId}-original${ext}`;
    storedName = `${fileId}.webp`;
    storedMimeType = 'image/webp';

    await putUploadObject(originalStoredName, sourceBuffer, mimeType);

    const previewBuffer = (await sharp(sourceBuffer)
      .rotate()
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()) as Buffer;

    await putUploadObject(storedName, previewBuffer, 'image/webp');
  } else {
    storedName = `${fileId}.pdf`;
    await putUploadObject(storedName, sourceBuffer, mimeType);
  }

  const now = new Date().toISOString();

  await db.uploadedFiles.insert({
    id: fileId,
    sessionId: session.id,
    originalName: file.name.slice(0, 255),
    storedName,
    originalStoredName,
    mimeType: storedMimeType,
    size: Math.max(0, Math.round(Number(file.size))),
    createdAt: now,
  }).catch((err) => {
    throw new Error(formatSupabaseError(err));
  });

  await db.uploadSessions.incrementUploadCount(session.id);

  return { fileId, originalName: file.name };
}

export async function processPrintUpload(
  token: string,
  file: File,
): Promise<{ fileId: string; originalName: string }> {
  const session = await validateUploadToken(token);
  if (!session) {
    throw new Error('Invalid or expired upload session');
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    throw new Error('Invalid or expired upload session');
  }

  if (session.uploadCount >= MAX_UPLOADS_PER_SESSION) {
    throw new Error('Upload limit reached for this session');
  }

  if (file.size > MAX_PRINT_FILE_SIZE) {
    throw new Error('File too large');
  }

  const mimeType = resolveMimeType(file);
  if (mimeType !== 'image/png') {
    throw new Error('Print uploads must be PNG');
  }

  const fileId = nanoid();
  const arrayBuffer = await file.arrayBuffer();
  const sourceBuffer = Buffer.from(arrayBuffer) as unknown as Buffer;

  await validateUploadBuffer(sourceBuffer, mimeType);

  const storedName = `${fileId}.png`;

  await putUploadObject(storedName, sourceBuffer, mimeType);

  const now = new Date().toISOString();

  await db.uploadedFiles.insert({
    id: fileId,
    sessionId: session.id,
    originalName: file.name.slice(0, 255),
    storedName,
    originalStoredName: storedName,
    mimeType: 'image/png',
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
