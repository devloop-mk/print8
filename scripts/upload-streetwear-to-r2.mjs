import fs from 'fs';
import path from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

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
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

async function main() {
  loadEnv();
  const dryRun = process.argv.includes('--dry-run');

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error('Missing R2 environment variables');
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const mastersRoot = path.join(process.cwd(), 'print-masters/streetwear');
  const webRoot = path.join(process.cwd(), 'public/NEW_DESIGNS/streetwear');

  let uploaded = 0;

  for (const [root, prefix, cacheControl] of [
    [mastersRoot, 'masters/streetwear', 'private, max-age=31536000'],
    [webRoot, 'catalog/NEW_DESIGNS/streetwear', 'public, max-age=31536000, immutable'],
  ]) {
    if (!fs.existsSync(root)) {
      console.warn('Missing folder:', root);
      continue;
    }

    const files = walkFiles(root);
    for (const filePath of files) {
      const relative = path.relative(root, filePath).split(path.sep).join('/');
      const key = `${prefix}/${relative}`;
      const ext = path.extname(filePath).toLowerCase();
      const contentType =
        ext === '.webp'
          ? 'image/webp'
          : ext === '.png'
            ? 'image/png'
            : 'application/octet-stream';

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
          ContentType: contentType,
          CacheControl: cacheControl,
        }),
      );
      uploaded += 1;
      if (uploaded % 50 === 0) console.log(`Uploaded ${uploaded} files...`);
    }
  }

  console.log(`${dryRun ? 'Planned' : 'Uploaded'} ${uploaded} streetwear assets to R2`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
