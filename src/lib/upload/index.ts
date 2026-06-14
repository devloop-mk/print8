import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';

export let UPLOAD_DIR = path.join(process.cwd(), 'uploads');
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_UPLOADS_PER_SESSION = 10;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function ensureUploadDir() {
  try {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  } catch (err) {
    // fallback to OS temp directory when repository filesystem is read-only (e.g. Vercel)
    const tmpDir = path.join(os.tmpdir(), 'print8-uploads');
    try {
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      UPLOAD_DIR = tmpDir;
    } catch (e) {
      // if even tmp dir fails, rethrow to let caller handle
      throw e;
    }
  }
}

export async function createUploadSession(): Promise<{
  sessionId: string;
  token: string;
}> {
  const sessionId = nanoid();
  const token = nanoid(32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

  db.uploadSessions.insert({
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

  ensureUploadDir();

  const fileId = nanoid();
  const ext = file.type === 'application/pdf' ? '.pdf' : '.webp';
  const storedName = `${fileId}${ext}`;
  const storedPath = path.join(UPLOAD_DIR, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type.startsWith('image/')) {
    await sharp(buffer)
      .rotate()
      .resize(4096, 4096, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(storedPath);
  } else {
    fs.writeFileSync(storedPath, buffer);
  }

  const now = new Date().toISOString();

  db.uploadedFiles.insert({
    id: fileId,
    sessionId: session.id,
    originalName: file.name.slice(0, 255),
    storedName,
    mimeType: file.type.startsWith('image/') ? 'image/webp' : file.type,
    size: file.size,
    createdAt: now,
  });

  db.uploadSessions.incrementUploadCount(session.id);

  return { fileId, originalName: file.name };
}

export async function getUploadedFile(fileId: string) {
  return db.uploadedFiles.findById(fileId);
}

export function getFilePath(storedName: string): string {
  const resolved = path.resolve(UPLOAD_DIR, storedName);
  if (!resolved.startsWith(path.resolve(UPLOAD_DIR))) {
    throw new Error('Invalid file path');
  }
  return resolved;
}
