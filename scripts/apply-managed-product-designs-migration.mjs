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
    console.error(
      [
        'Missing database connection.',
        '',
        'Add one of these to .env.local:',
        '  SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@...pooler.supabase.com:5432/postgres',
        '  SUPABASE_DB_PASSWORD=your_database_password',
        '',
        'Get the connection string from:',
        '  Supabase Dashboard → Project Settings → Database → Connection string → URI',
        '',
        'Or run the SQL manually in:',
        '  Supabase Dashboard → SQL Editor',
        '  File: supabase/migrations/add-managed-product-designs.sql',
      ].join('\n'),
    );
    process.exit(1);
  }

  const sqlPath = path.join(
    process.cwd(),
    'supabase/migrations/add-managed-product-designs.sql',
  );
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    console.log('managed_product_designs table is ready.');
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
