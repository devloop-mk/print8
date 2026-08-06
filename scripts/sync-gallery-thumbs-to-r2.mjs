/**
 * Upload only gallery thumbs to R2 (faster than full NEW_DESIGNS sync).
 *
 *   node scripts/sync-gallery-thumbs-to-r2.mjs
 *   node scripts/sync-gallery-thumbs-to-r2.mjs --dry-run
 */
import fs from 'fs';
import path from 'path';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force') || true;

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function getClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Missing R2 credentials in .env.local');
  }
  return {
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    }),
    bucket,
  };
}

async function main() {
  loadEnv();
  const { client, bucket } = getClient();
  const thumbDir = path.join(process.cwd(), 'public', 'NEW_DESIGNS', 'gallery-thumbs');
  const files = fs
    .readdirSync(thumbDir)
    .filter((name) => name.endsWith('.webp') && !name.endsWith('.flat.webp'));

  let uploaded = 0;
  for (const name of files) {
    const key = `catalog/NEW_DESIGNS/gallery-thumbs/${name}`;
    if (dryRun) {
      console.log(`[dry-run] ${key}`);
      uploaded += 1;
      continue;
    }
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fs.readFileSync(path.join(thumbDir, name)),
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=86400',
      }),
    );
    uploaded += 1;
  }
  console.log(`${dryRun ? 'Would upload' : 'Uploaded'} ${uploaded} gallery thumbs to R2.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
