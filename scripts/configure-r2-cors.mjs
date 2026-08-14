/**
 * Apply a CORS policy on the R2 bucket so canvas / crossOrigin loads work from
 * the site and Vercel preview URLs when using the public `.r2.dev` CDN directly.
 *
 *   node scripts/configure-r2-cors.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

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

async function main() {
  loadEnv();
  const { client, bucket } = getClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  const origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://print8-eta.vercel.app',
    'https://print8.mk',
    'https://www.print8.mk',
  ];
  if (siteUrl && !origins.includes(siteUrl)) {
    origins.push(siteUrl);
  }

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'HEAD'],
            AllowedOrigins: origins,
            MaxAgeSeconds: 86400,
          },
        ],
      },
    }),
  );

  console.log(`CORS updated on bucket "${bucket}" for origins:\n${origins.join('\n')}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
