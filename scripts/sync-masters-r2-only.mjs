/**
 * Retry print-masters → R2 masters/ only (after partial sync failure).
 * Skips keys that already exist unless --force. Logs errors and continues.
 *
 * Usage:
 *   node scripts/sync-masters-r2-only.mjs
 *   node scripts/sync-masters-r2-only.mjs --force
 */
import fs from 'fs';
import path from 'path';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const force = process.argv.includes('--force');

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

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
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

loadEnv();

const bucket = process.env.R2_BUCKET_NAME;
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const root = path.join(process.cwd(), 'print-masters');
const files = walkFiles(root);
console.log(
  `Syncing ${files.length} print-master files → masters/ (force=${force})`,
);

let uploaded = 0;
let skipped = 0;
let errors = 0;

for (const filePath of files) {
  const relative = path.relative(root, filePath).split(path.sep).join('/');
  const key = `masters/${relative}`;
  try {
    if (!force) {
      const exists = await objectExists(client, bucket, key);
      if (exists) {
        skipped += 1;
        continue;
      }
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fs.readFileSync(filePath),
        ContentType: 'image/png',
        CacheControl: 'private, max-age=31536000',
      }),
    );
    uploaded += 1;
    if ((uploaded + skipped) % 50 === 0) {
      console.log(
        `Progress ${uploaded + skipped}/${files.length} (uploaded=${uploaded}, skipped=${skipped})...`,
      );
    }
  } catch (error) {
    errors += 1;
    console.error(
      `FAIL ${relative}:`,
      error instanceof Error ? error.message : error,
    );
  }
}

console.log(
  `Done. uploaded=${uploaded} skipped=${skipped} errors=${errors} total=${files.length}`,
);
if (errors > 0) process.exit(1);
