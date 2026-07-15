/**
 * Batch-shrink t-shirt overlay scales so designs fit the shirt / print area
 * after the new photo mockups (more canvas padding than old square assets).
 *
 * Print area width ≈ 47% of frame; previous default 52 → target 40.
 *
 * Usage:
 *   node scripts/fit-tshirt-design-overlays.mjs [--dry-run] [--db]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');
const UPDATE_DB = process.argv.includes('--db');

const FIT_THRESHOLD = 42;
const SCALE_RATIO = 40 / 52;

const FILES = [
  'src/lib/data/streetwear-pack.ts',
  'src/lib/data/catalog.ts',
  'src/lib/data/baby-pack.ts',
  'src/lib/data/couple-pack.ts',
  'scripts/import-streetwear-designs.mjs',
  'scripts/streetwear-pack-manifest.json',
];

function fitScale(scale) {
  if (typeof scale !== 'number' || Number.isNaN(scale)) return scale;
  if (scale <= FIT_THRESHOLD) return scale;
  return Math.max(34, Math.round(scale * SCALE_RATIO));
}

function rewriteText(source) {
  let changed = 0;

  let next = source.replace(
    /(overlayScale"?\s*:\s*)(\d+)/g,
    (match, prefix, raw) => {
      const oldScale = Number(raw);
      const newScale = fitScale(oldScale);
      if (newScale === oldScale) return match;
      changed += 1;
      return `${prefix}${newScale}`;
    },
  );

  // Per-product-type overrides — nested braces break [^}]* so match explicitly.
  next = next.replace(
    /(hoodie:\s*\{\s*position:\s*\{\s*x:\s*\d+,\s*y:\s*\d+\s*\},\s*scale:\s*)(\d+)/g,
    (match, prefix, raw) => {
      const oldScale = Number(raw);
      const newScale = fitScale(oldScale);
      if (newScale === oldScale) return match;
      changed += 1;
      return `${prefix}${newScale}`;
    },
  );

  next = next.replace(
    /("hoodie"\s*:\s*\{\s*"position"\s*:\s*\{[^}]+\},\s*"scale"\s*:\s*)(\d+)/g,
    (match, prefix, raw) => {
      const oldScale = Number(raw);
      const newScale = fitScale(oldScale);
      if (newScale === oldScale) return match;
      changed += 1;
      return `${prefix}${newScale}`;
    },
  );

  return { next, changed };
}

function shrinkTemplateScales(template) {
  if (!template || typeof template !== 'object') {
    return { template, changed: false };
  }

  let changed = false;
  const next = { ...template };

  if (typeof next.overlayScale === 'number') {
    const fitted = fitScale(next.overlayScale);
    if (fitted !== next.overlayScale) {
      next.overlayScale = fitted;
      changed = true;
    }
  }

  if (next.overlayByProductType && typeof next.overlayByProductType === 'object') {
    const byType = { ...next.overlayByProductType };
    for (const [type, config] of Object.entries(byType)) {
      if (!config || typeof config !== 'object') continue;
      const copy = { ...config };
      if (typeof copy.scale === 'number') {
        const fitted = fitScale(copy.scale);
        if (fitted !== copy.scale) {
          copy.scale = fitted;
          byType[type] = copy;
          changed = true;
        }
      }
    }
    next.overlayByProductType = byType;
  }

  if (next.sides && typeof next.sides === 'object') {
    const sides = { ...next.sides };
    for (const [side, sideConfig] of Object.entries(sides)) {
      if (!sideConfig || typeof sideConfig !== 'object') continue;
      const { template: sideNext, changed: sideChanged } =
        shrinkTemplateScales(sideConfig);
      if (sideChanged) {
        sides[side] = sideNext;
        changed = true;
      }
    }
    next.sides = sides;
  }

  return { template: next, changed };
}

function patchFiles() {
  let total = 0;
  for (const relative of FILES) {
    const filePath = path.join(ROOT, relative);
    if (!fs.existsSync(filePath)) {
      console.warn('skip missing', relative);
      continue;
    }
    const source = fs.readFileSync(filePath, 'utf8');
    const { next, changed } = rewriteText(source);
    console.log(`${relative}: ${changed} scale(s)`);
    total += changed;
    if (!DRY_RUN && changed > 0) {
      fs.writeFileSync(filePath, next);
    }
  }
  return total;
}

async function patchManagedDatabase() {
  // Load .env.local if present
  const envPath = path.join(ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
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

  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn(
      'DB skip: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    );
    return 0;
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('managed_product_designs')
    .select('id, template, active, sort_order');
  if (error) throw new Error(error.message);

  let updated = 0;
  for (const row of data ?? []) {
    const productTypes = row.template?.productTypes ?? [];
    if (
      productTypes.length > 0 &&
      !productTypes.includes('t-shirt') &&
      !productTypes.includes('hoodie')
    ) {
      continue;
    }

    const { template, changed } = shrinkTemplateScales(row.template);
    if (!changed) continue;

    updated += 1;
    console.log(`DB ${row.id}: overlayScale ${row.template?.overlayScale} → ${template.overlayScale}`);
    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('managed_product_designs')
        .update({ template, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (updateError) throw new Error(`${row.id}: ${updateError.message}`);
    }
  }
  return updated;
}

const fileChanges = patchFiles();
console.log(
  `Files: ${fileChanges} scale value(s)${DRY_RUN ? ' (dry-run)' : ' written'}`,
);

if (UPDATE_DB) {
  const dbChanges = await patchManagedDatabase();
  console.log(
    `Database: ${dbChanges} design(s)${DRY_RUN ? ' (dry-run)' : ' updated'}`,
  );
} else {
  console.log('Database: skipped (pass --db to update managed_product_designs)');
}
