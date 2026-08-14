import { getSupabaseAdmin } from '@/lib/supabase/client';
import {
  isR2Configured,
  r2DeleteObject,
  r2GetObject,
  r2PutObject,
  isR2NoSuchKeyError,
} from '@/lib/storage/r2-client';

const UPLOAD_PREFIX = 'uploads/';
const CATALOG_PREFIX = 'catalog/';
const ORDER_PRINT_PREFIX = 'order-prints/';
const EMAIL_PREVIEW_PREFIX = 'email-previews/';

function getSupabaseBucket() {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error('SUPABASE_STORAGE_BUCKET is not set');
  }
  return bucket;
}

export function getStorageProvider(): 'r2' | 'supabase' {
  return isR2Configured() ? 'r2' : 'supabase';
}

function uploadObjectKey(storedName: string) {
  return `${UPLOAD_PREFIX}${storedName}`;
}

function catalogObjectKey(relativePath: string) {
  const normalized = relativePath.startsWith('/')
    ? relativePath.slice(1)
    : relativePath;
  return `${CATALOG_PREFIX}${normalized}`;
}

function orderPrintObjectKey(storedName: string) {
  const normalized = storedName
    .replace(/^\/+/, '')
    .replace(/^order-prints\//, '');
  return `${ORDER_PRINT_PREFIX}${normalized}`;
}

async function getOrderPrintObjectFromSupabase(key: string): Promise<{
  body: Buffer;
  contentType: string | undefined;
} | null> {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!bucket) return null;

  const { data, error } = await getSupabaseAdmin().storage.from(bucket).download(key);

  if (error || !data) return null;

  const buffer = Buffer.from(await data.arrayBuffer());
  return { body: buffer, contentType: undefined };
}

function emailPreviewObjectKey(orderNumber: string, filename: string) {
  const safeOrder = orderNumber.replace(/[^\w-]/g, '');
  const safeFile = filename.replace(/[^\w.\-]/g, '_');
  return `${EMAIL_PREVIEW_PREFIX}${safeOrder}/${safeFile}`;
}

export async function putUploadObject(
  storedName: string,
  body: Buffer,
  contentType: string,
) {
  if (isR2Configured()) {
    await r2PutObject(uploadObjectKey(storedName), body, contentType, {
      cacheControl: 'private, max-age=3600',
    });
    return;
  }

  const { error } = await getSupabaseAdmin().storage
    .from(getSupabaseBucket())
    .upload(storedName, body, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getUploadObject(storedName: string): Promise<{
  body: Buffer;
  contentType: string | undefined;
}> {
  if (isR2Configured()) {
    return r2GetObject(uploadObjectKey(storedName));
  }

  const { data, error } = await getSupabaseAdmin().storage
    .from(getSupabaseBucket())
    .download(storedName);

  if (error || !data) {
    throw new Error(error?.message ?? 'Download failed');
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return { body: buffer, contentType: undefined };
}

export async function deleteUploadObject(storedName: string) {
  if (isR2Configured()) {
    await r2DeleteObject(uploadObjectKey(storedName));
    return;
  }

  const { error } = await getSupabaseAdmin().storage
    .from(getSupabaseBucket())
    .remove([storedName]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function putCatalogObject(
  relativePath: string,
  body: Buffer,
  contentType: string,
) {
  if (!isR2Configured()) {
    throw new Error('Catalog upload requires Cloudflare R2');
  }

  await r2PutObject(catalogObjectKey(relativePath), body, contentType, {
    cacheControl: 'public, max-age=31536000, immutable',
  });
}

export function catalogStoragePath(relativePath: string) {
  const normalized = relativePath.startsWith('/')
    ? relativePath
    : `/${relativePath}`;
  return normalized;
}

/** Private print-ready order assets (SVGs). Prefer R2; fall back to Supabase Storage. */
export async function putOrderPrintObject(
  storedName: string,
  body: Buffer,
  contentType: string,
) {
  const key = orderPrintObjectKey(storedName);

  if (isR2Configured()) {
    await r2PutObject(key, body, contentType, {
      cacheControl: 'private, max-age=31536000',
    });
    return;
  }

  const { error } = await getSupabaseAdmin().storage
    .from(getSupabaseBucket())
    .upload(key, body, {
      contentType,
      cacheControl: '31536000',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getOrderPrintObject(storedName: string): Promise<{
  body: Buffer;
  contentType: string | undefined;
}> {
  const key = orderPrintObjectKey(storedName);

  if (isR2Configured()) {
    try {
      return await r2GetObject(key);
    } catch (error) {
      if (!isR2NoSuchKeyError(error)) throw error;

      const fromSupabase = await getOrderPrintObjectFromSupabase(key);
      if (fromSupabase) return fromSupabase;

      throw new Error(`Order print object not found in R2 or Supabase: ${key}`);
    }
  }

  const fromSupabase = await getOrderPrintObjectFromSupabase(key);
  if (fromSupabase) return fromSupabase;

  throw new Error(`Order print object not found: ${key}`);
}

export async function putEmailPreviewObject(
  orderNumber: string,
  filename: string,
  body: Buffer,
  contentType: string,
) {
  const key = emailPreviewObjectKey(orderNumber, filename);

  if (isR2Configured()) {
    await r2PutObject(key, body, contentType, {
      cacheControl: 'private, max-age=2592000',
    });
    return key;
  }

  const { error } = await getSupabaseAdmin().storage
    .from(getSupabaseBucket())
    .upload(key, body, {
      contentType,
      cacheControl: '2592000',
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return key;
}

export async function getEmailPreviewObject(
  orderNumber: string,
  filename: string,
): Promise<{ body: Buffer; contentType: string | undefined }> {
  const key = emailPreviewObjectKey(orderNumber, filename);

  if (isR2Configured()) {
    return r2GetObject(key);
  }

  const { data, error } = await getSupabaseAdmin().storage
    .from(getSupabaseBucket())
    .download(key);

  if (error || !data) {
    throw new Error(error?.message ?? 'Download failed');
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return { body: buffer, contentType: undefined };
}
