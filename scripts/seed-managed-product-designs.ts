/**
 * Seed all static `productDesignTemplates` into `managed_product_designs`.
 *
 * Idempotent upsert by id. Skips existing rows unless `--overwrite` is passed.
 * Preserves existing `active` / `sort_order` on overwrite of template JSON.
 *
 * Usage:
 *   npx tsx scripts/seed-managed-product-designs.ts
 *   npx tsx scripts/seed-managed-product-designs.ts --overwrite
 *   npx tsx scripts/seed-managed-product-designs.ts --dry-run
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (.env.local).
 */
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { productDesignTemplates } from '../src/lib/data/catalog';

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

loadEnv();

const overwrite = process.argv.includes('--overwrite');
const dryRun = process.argv.includes('--dry-run');
const chunkSize = 100;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function listExistingIds(): Promise<
  Map<string, { active: boolean; sort_order: number; created_at: string }>
> {
  const map = new Map<
    string,
    { active: boolean; sort_order: number; created_at: string }
  >();
  const pageSize = 1000;
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from('managed_product_designs')
      .select('id, active, sort_order, created_at')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    for (const row of batch) {
      map.set(row.id, {
        active: row.active,
        sort_order: row.sort_order,
        created_at: row.created_at,
      });
    }
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return map;
}

async function main() {
  console.log(
    `Static product designs: ${productDesignTemplates.length} (overwrite=${overwrite}, dryRun=${dryRun})`,
  );

  const existing = await listExistingIds();
  const now = new Date().toISOString();
  const rows = [];
  let skipped = 0;

  for (const template of productDesignTemplates) {
    const current = existing.get(template.id);
    if (current && !overwrite) {
      skipped += 1;
      continue;
    }
    rows.push({
      id: template.id,
      template,
      active: current?.active ?? true,
      sort_order: current?.sort_order ?? 0,
      created_at: current?.created_at ?? now,
      updated_at: now,
    });
  }

  console.log(`Will upsert: ${rows.length}, skip existing: ${skipped}`);

  if (dryRun) {
    console.log('[dry-run] No database writes.');
    return;
  }

  let upserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('managed_product_designs')
      .upsert(chunk);
    if (error) {
      console.error(`Upsert failed at offset ${i}:`, error.message);
      process.exit(1);
    }
    upserted += chunk.length;
    console.log(`Upserted ${upserted}/${rows.length}...`);
  }

  console.log(
    `Done. imported=${upserted} skipped=${skipped} total=${productDesignTemplates.length}`,
  );
  console.log(
    'Set CATALOG_SOURCE=database (or rely on production default) so the storefront reads from Supabase.',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
