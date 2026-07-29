/**
 * List all productDesignTemplates from code, grouped by collection.
 * With --missing-only, compare against Supabase and list rows not yet seeded.
 *
 * Usage:
 *   npx tsx scripts/audit-code-designs.ts
 *   npx tsx scripts/audit-code-designs.ts --missing-only
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

async function listDbIds(): Promise<Set<string> | null> {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ids = new Set<string>();
  let from = 0;
  const pageSize = 1000;

  for (;;) {
    const { data, error } = await supabase
      .from('managed_product_designs')
      .select('id')
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    for (const row of batch) ids.add(row.id);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return ids;
}

async function main() {
  const missingOnly = process.argv.includes('--missing-only');

  const byCollection = new Map<string, typeof productDesignTemplates>();
  const items = [...productDesignTemplates];

  for (const d of items) {
    const col = d.collection ?? '(inline — catalog.ts)';
    const list = byCollection.get(col) ?? [];
    list.push(d);
    byCollection.set(col, list);
  }

  let dbIds: Set<string> | null = null;
  const wantDb = missingOnly || process.argv.includes('--stale');
  if (wantDb) {
    dbIds = await listDbIds();
    if (!dbIds) {
      console.error('Cannot load DB ids — check .env.local');
      process.exit(1);
    }
  }

  const filter = (list: typeof productDesignTemplates) =>
    missingOnly && dbIds ? list.filter((d) => !dbIds!.has(d.id)) : list;

  console.log(`Total in code: ${items.length}`);
  if (dbIds) {
    const missing = items.filter((d) => !dbIds!.has(d.id));
    const extra = [...dbIds].filter(
      (id) => !items.some((d) => d.id === id),
    );
    console.log(`In database: ${dbIds.size}`);
    console.log(`Missing from DB (need seed): ${missing.length}`);
    console.log(`DB-only (admin-created, not in code): ${extra.length}`);
    if (extra.length > 0 && process.argv.includes('--stale')) {
      console.log('\n## Stale DB rows (removed from code)');
      for (const id of extra.sort()) console.log(`  ${id}`);
    }
    console.log('');
  }

  const sorted = [...byCollection.entries()].sort(
    (a, b) => filter(b[1]).length - filter(a[1]).length,
  );

  for (const [col, list] of sorted) {
    const shown = filter(list);
    if (missingOnly && shown.length === 0) continue;
    console.log(
      `\n## ${col} (${shown.length}${missingOnly ? '' : ` / ${list.length}`})`,
    );
    for (const d of [...shown].sort((a, b) => a.id.localeCompare(b.id))) {
      console.log(`  ${d.id} | ${d.titleMk ?? d.nameKey ?? ''}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
