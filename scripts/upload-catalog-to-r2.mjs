import fs from 'fs';
import path from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const publicRoot = path.join(process.cwd(), 'public');
const includeArg = process.argv.find((arg) => arg.startsWith('--include='));
const dryRun = process.argv.includes('--dry-run');

const includeDirs = includeArg
  ? includeArg
      .replace('--include=', '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  : ['NEW_DESIGNS', 't-shirts', 'mugs', 'hoodies', 'stickers', 'showcase'];

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
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
  };
  return map[ext] || 'application/octet-stream';
}

function walkFiles(dir) {
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

async function main() {
  loadEnv();
  const { client, bucket } = getClient();
  let uploaded = 0;
  let skipped = 0;

  for (const includeDir of includeDirs) {
    const sourceDir = path.join(publicRoot, includeDir);
    if (!fs.existsSync(sourceDir)) {
      console.warn(`Skipping missing directory: ${includeDir}`);
      continue;
    }

    const files = walkFiles(sourceDir);
    for (const filePath of files) {
      const relative = path
        .relative(publicRoot, filePath)
        .split(path.sep)
        .join('/');
      const key = `catalog/${relative}`;
      const contentType = contentTypeFor(filePath);

      if (dryRun) {
        console.log(`[dry-run] ${key}`);
        uploaded += 1;
        continue;
      }

      const body = fs.readFileSync(filePath);
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: String(contentType),
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      uploaded += 1;
      if (uploaded % 25 === 0) {
        console.log(`Uploaded ${uploaded} files...`);
      }
    }
  }

  console.log(
    `${dryRun ? 'Planned' : 'Uploaded'} ${uploaded} catalog files to R2 (${skipped} skipped)`,
  );
  console.log(
    'Set NEXT_PUBLIC_ASSETS_CDN_URL to your R2 public bucket URL or custom domain.',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
