/**
 * Fast DB normalize: set all t-shirt/hoodie managed designs to shared
 * scale + chest position (no per-image measuring).
 *
 *   node scripts/normalize-tshirt-design-placement-db.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');
const POSITION = { x: 50, y: 54 };
const SCALE = 40;
const HOODIE_POSITION = { x: 50, y: 59 };
const HOODIE_SCALE = 33;

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

function normalizeTemplate(template) {
  const next = { ...template };
  next.overlayScale = SCALE;
  next.overlayPosition = { ...POSITION };

  if (next.overlayByProductType && typeof next.overlayByProductType === 'object') {
    const byType = { ...next.overlayByProductType };
    if (byType['t-shirt']) {
      byType['t-shirt'] = {
        ...byType['t-shirt'],
        scale: SCALE,
        position: { ...POSITION },
      };
    }
    if (byType.hoodie) {
      byType.hoodie = {
        ...byType.hoodie,
        scale: HOODIE_SCALE,
        position: { ...HOODIE_POSITION },
      };
    }
    next.overlayByProductType = byType;
  }

  return next;
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
  const template = row.template;
  const productTypes = template?.productTypes ?? [];
  if (
    productTypes.length > 0 &&
    !productTypes.includes('t-shirt') &&
    !productTypes.includes('hoodie')
  ) {
    skipped += 1;
    continue;
  }

  const next = normalizeTemplate(template);
  const same =
    template.overlayScale === next.overlayScale &&
    template.overlayPosition?.x === next.overlayPosition.x &&
    template.overlayPosition?.y === next.overlayPosition.y;
  if (same) {
    skipped += 1;
    continue;
  }

  updated += 1;
  if (updated <= 20 || String(row.id).startsWith('tee-print-')) {
    console.log(
      `${row.id}: scale ${template.overlayScale}→${SCALE}, y ${template.overlayPosition?.y}→${POSITION.y}`,
    );
  }

  if (!DRY_RUN) {
    const { error: updateError } = await supabase
      .from('managed_product_designs')
      .update({ template: next, updated_at: new Date().toISOString() })
      .eq('id', row.id);
    if (updateError) throw new Error(`${row.id}: ${updateError.message}`);
  }
}

console.log(
  `Done: ${updated} updated, ${skipped} skipped${DRY_RUN ? ' (dry-run)' : ''}`,
);
