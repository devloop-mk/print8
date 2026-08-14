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

async function detectMimeTypeFromBuffer(buffer: Buffer): Promise<string> {
  if (buffer.subarray(0, 5).toString('ascii').startsWith('%PDF-')) {
    return 'application/pdf';
  }

  const meta = await sharp(buffer).metadata();
  if (meta.format === 'jpeg') return 'image/jpeg';
  if (meta.format === 'png') return 'image/png';
  if (meta.format === 'webp') return 'image/webp';

  throw new Error('File type not allowed');
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

  const reserved = await db.uploadSessions.incrementUploadCount(
    session.id,
    MAX_UPLOADS_PER_SESSION,
  );
  if (!reserved) {
    throw new Error('Upload limit reached for this session');
  }

  const fileId = nanoid();
  const arrayBuffer = await file.arrayBuffer();
  const sourceBuffer = Buffer.from(arrayBuffer) as unknown as Buffer;

  const mimeType = await detectMimeTypeFromBuffer(sourceBuffer);
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error('File type not allowed');
  }

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

  const reserved = await db.uploadSessions.incrementUploadCount(
    session.id,
    MAX_UPLOADS_PER_SESSION,
  );
  if (!reserved) {
    throw new Error('Upload limit reached for this session');
  }

  const fileId = nanoid();
  const arrayBuffer = await file.arrayBuffer();
  const sourceBuffer = Buffer.from(arrayBuffer) as unknown as Buffer;

  const mimeType = await detectMimeTypeFromBuffer(sourceBuffer);
  if (mimeType !== 'image/png') {
    throw new Error('Print uploads must be PNG');
  }

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

  return { fileId, originalName: file.name };
}

export async function getUploadedFile(fileId: string) {
  return db.uploadedFiles.findById(fileId);
}
