import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

let client: S3Client | null = null;

export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME,
  );
}

export function getR2BucketName() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('R2_BUCKET_NAME is not set');
  }
  return bucket;
}

export function getR2Client() {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 is not configured');
  }

  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  return client;
}

export async function r2PutObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
  options?: { cacheControl?: string },
) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: options?.cacheControl,
    }),
  );
}

export async function r2GetObject(key: string): Promise<{
  body: Buffer;
  contentType: string | undefined;
}> {
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error(`R2 object not found: ${key}`);
  }

  const bytes = await response.Body.transformToByteArray();
  return {
    body: Buffer.from(bytes),
    contentType: response.ContentType,
  };
}

export function isR2NoSuchKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const record = error as { name?: string; Code?: string; code?: string };
  return (
    record.name === 'NoSuchKey' ||
    record.Code === 'NoSuchKey' ||
    record.code === 'NoSuchKey'
  );
}

export async function r2DeleteObject(key: string) {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getR2BucketName(),
      Key: key,
    }),
  );
}
