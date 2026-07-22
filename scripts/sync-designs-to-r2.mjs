/**
 * Sync `public/NEW_DESIGNS` → R2 `catalog/NEW_DESIGNS/`.
 *
 * Production storefront resolves these paths via NEXT_PUBLIC_ASSETS_CDN_URL
 * (see `src/lib/storage/asset-url.ts`). Keep `public/NEW_DESIGNS` in git for
 * local/dev; do not treat it as the production source of truth.
 *
 * Usage:
 *   node scripts/sync-designs-to-r2.mjs
 *   node scripts/sync-designs-to-r2.mjs --dry-run
 *   node scripts/sync-designs-to-r2.mjs --force          # re-upload even if key exists
 *   node scripts/sync-designs-to-r2.mjs --include=masters  # also sync print-masters/ → masters/
 *
 * Related: `npm run upload:catalog-r2` uploads several public folders at once
 * (always PutObject, no skip-existing). Prefer this script for design-art sync.
 *
 * Requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.
 */
import fs from 'fs';
import path from 'path';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');
const includeMasters = process.argv.includes('--include=masters');

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
    throw new Error(
      'Missing R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or R2_BUCKET_NAME',
    );
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

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
  };
  return map[ext] || 'application/octet-stream';
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

async function objectExists(client, bucket, key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    const name = error?.name ?? '';
    if (status === 404 || name === 'NotFound' || name === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
}

async function syncTree({
  client,
  bucket,
  sourceRoot,
  keyPrefix,
  cacheControl,
}) {
  const files = walkFiles(sourceRoot);
  let uploaded = 0;
  let skipped = 0;

  if (files.length === 0) {
    console.warn(`No files under ${sourceRoot}`);
    return { uploaded, skipped };
  }

  for (const filePath of files) {
    const relative = path
      .relative(sourceRoot, filePath)
      .split(path.sep)
      .join('/');
    const key = `${keyPrefix}/${relative}`;

    if (!force && !dryRun) {
      const exists = await objectExists(client, bucket, key);
      if (exists) {
        skipped += 1;
        continue;
      }
    }

    if (dryRun) {
      console.log(`[dry-run] ${key}`);
      uploaded += 1;
      continue;
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fs.readFileSync(filePath),
        ContentType: contentTypeFor(filePath),
        CacheControl: cacheControl,
      }),
    );
    uploaded += 1;
    if (uploaded % 25 === 0) {
      console.log(`Uploaded ${uploaded} files (skipped ${skipped})...`);
    }
  }

  return { uploaded, skipped };
}

async function main() {
  loadEnv();
  const { client, bucket } = getClient();

  const designsRoot = path.join(process.cwd(), 'public', 'NEW_DESIGNS');
  console.log(
    `Syncing ${designsRoot} → catalog/NEW_DESIGNS/ (force=${force}, dryRun=${dryRun})`,
  );

  const designs = await syncTree({
    client,
    bucket,
    sourceRoot: designsRoot,
    keyPrefix: 'catalog/NEW_DESIGNS',
    cacheControl: 'public, max-age=31536000, immutable',
  });

  let masters = { uploaded: 0, skipped: 0 };
  if (includeMasters) {
    const mastersRoot = path.join(process.cwd(), 'print-masters');
    console.log(`Also syncing ${mastersRoot} → masters/`);
    masters = await syncTree({
      client,
      bucket,
      sourceRoot: mastersRoot,
      keyPrefix: 'masters',
      cacheControl: 'private, max-age=31536000',
    });
  }

  console.log(
    `${dryRun ? 'Planned' : 'Uploaded'} designs=${designs.uploaded} skipped=${designs.skipped}` +
      (includeMasters
        ? `; masters=${masters.uploaded} skipped=${masters.skipped}`
        : ''),
  );
  console.log(
    'Ensure NEXT_PUBLIC_ASSETS_CDN_URL points at the R2 public URL / custom domain.',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
