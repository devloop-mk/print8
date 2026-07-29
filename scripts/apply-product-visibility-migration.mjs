import fs from 'fs';
import path from 'path';
import pg from 'pg';

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

function getDatabaseUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const password = process.env.SUPABASE_DB_PASSWORD;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !url) return null;

  const ref = new URL(url).hostname.split('.')[0];
  const region = process.env.SUPABASE_DB_REGION ?? 'eu-central-1';
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
}

async function main() {
  loadEnv();
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    console.error('Missing SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local');
    process.exit(1);
  }

  const sql = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/add-product-visibility.sql'),
    'utf8',
  );

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(sql);
    console.log('cms_product_visibility migration applied (hoodie-basic hidden by default).');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
