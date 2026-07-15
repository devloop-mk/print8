/**
 * Nudge t-shirt overlay Y down by 5% on managed designs (chest sits a bit low).
 * Updates overlayPosition.y and overlayByProductType['t-shirt'].position.y when ≈49.
 *
 *   node scripts/nudge-tshirt-design-y-db.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');
const DELTA = 5;
const FROM_Y = 49;
const TO_Y = FROM_Y + DELTA;

function loadEnvLocal() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function near(value, target, tol = 0.6) {
  return typeof value === 'number' && Math.abs(value - target) <= tol;
}

function nudgeTemplate(template) {
  const next = { ...template };
  let changed = false;

  if (next.overlayPosition && near(next.overlayPosition.y, FROM_Y)) {
    next.overlayPosition = { ...next.overlayPosition, y: TO_Y };
    changed = true;
  }

  if (next.overlayByProductType && typeof next.overlayByProductType === 'object') {
    const byType = { ...next.overlayByProductType };
    const tee = byType['t-shirt'];
    if (tee?.position && near(tee.position.y, FROM_Y)) {
      byType['t-shirt'] = {
        ...tee,
        position: { ...tee.position, y: TO_Y },
      };
      next.overlayByProductType = byType;
      changed = true;
    }
  }

  if (next.backOverlay) {
    const back = { ...next.backOverlay };
    let backChanged = false;
    if (back.overlayPosition && near(back.overlayPosition.y, FROM_Y)) {
      back.overlayPosition = { ...back.overlayPosition, y: TO_Y };
      backChanged = true;
    }
    if (back.overlayByProductType?.['t-shirt']?.position) {
      const tee = back.overlayByProductType['t-shirt'];
      if (near(tee.position.y, FROM_Y)) {
        back.overlayByProductType = {
          ...back.overlayByProductType,
          't-shirt': {
            ...tee,
            position: { ...tee.position, y: TO_Y },
          },
        };
        backChanged = true;
      }
    }
    if (backChanged) {
      next.backOverlay = back;
      changed = true;
    }
  }

  return changed ? next : null;
}

loadEnvLocal();
const { createClient } = await import('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);
const { data, error } = await supabase
  .from('managed_product_designs')
  .select('id, template');
if (error) throw new Error(error.message);

let updated = 0;
let skipped = 0;

for (const row of data ?? []) {
  const types = row.template?.productTypes ?? [];
  if (!types.includes('t-shirt')) {
    skipped += 1;
    continue;
  }
  const next = nudgeTemplate(row.template);
  if (!next) {
    skipped += 1;
    continue;
  }
  if (DRY_RUN) {
    console.log(`[dry-run] ${row.id}: y ${FROM_Y} → ${TO_Y}`);
    updated += 1;
    continue;
  }
  const { error: updateError } = await supabase
    .from('managed_product_designs')
    .update({ template: next })
    .eq('id', row.id);
  if (updateError) throw new Error(`${row.id}: ${updateError.message}`);
  console.log(`Updated ${row.id}`);
  updated += 1;
}

console.log(
  `${DRY_RUN ? 'Would update' : 'Updated'} ${updated}, skipped ${skipped}`,
);
