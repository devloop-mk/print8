/**
 * Bulk-fix hoodie overlay placement in managed_product_designs.
 *
 * Keeps admin-tuned hoodie scales (typically 24–32 on scale-40 tees).
 * Replaces bad seed values (41, 33, or anything >= tee scale) with
 * hoodie scale ≈ 70% of tee scale (median from manual admin tuning).
 *
 * Usage:
 *   node scripts/bulk-fix-hoodie-placements.mjs --dry-run
 *   node scripts/bulk-fix-hoodie-placements.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');
const HOODIE_SCALE_FACTOR = 28 / 40;
const HOODIE_Y = 60;

function loadEnv() {
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

function supportsTeeAndHoodie(template) {
  const types = template?.productTypes ?? [];
  return types.includes('t-shirt') && types.includes('hoodie');
}

function shouldKeepHoodieOverride(baseScale, hoodieScale) {
  return hoodieScale <= 32 && hoodieScale < baseScale * 0.85;
}

function needsHoodieFix(baseScale, hoodieScale) {
  if (typeof hoodieScale !== 'number') return true;
  if (shouldKeepHoodieOverride(baseScale, hoodieScale)) return false;
  if (hoodieScale >= baseScale) return true;
  if (hoodieScale >= 33) return true;
  return false;
}

function suggestHoodiePlacement(baseScale, basePosition) {
  return {
    scale: Math.max(14, Math.round(baseScale * HOODIE_SCALE_FACTOR)),
    position: {
      x: typeof basePosition?.x === 'number' ? basePosition.x : 50,
      y: HOODIE_Y,
    },
  };
}

function fixOverlayConfig(config, fallbackScale, fallbackPosition) {
  if (!config) return { config, changed: false };

  const baseScale = config.overlayScale ?? fallbackScale ?? 40;
  const basePosition = config.overlayPosition ?? fallbackPosition ?? { x: 50, y: 54 };
  const current = config.overlayByProductType?.hoodie;

  if (current && !needsHoodieFix(baseScale, current.scale)) {
    return { config, changed: false };
  }

  const hoodie = suggestHoodiePlacement(baseScale, basePosition);
  return {
    config: {
      ...config,
      overlayByProductType: {
        ...config.overlayByProductType,
        hoodie,
      },
    },
    changed: true,
  };
}

function fixTemplate(template) {
  if (!supportsTeeAndHoodie(template)) {
    return { template, changed: false };
  }

  let changed = false;
  const next = structuredClone(template);
  const fallbackScale = next.overlayScale ?? 40;
  const fallbackPosition = next.overlayPosition ?? { x: 50, y: 54 };

  const front = fixOverlayConfig(
    {
      overlayScale: next.overlayScale,
      overlayPosition: next.overlayPosition,
      overlayByProductType: next.overlayByProductType,
    },
    fallbackScale,
    fallbackPosition,
  );
  if (front.changed) {
    next.overlayByProductType = front.config.overlayByProductType;
    changed = true;
  }

  if (next.backOverlay) {
    const back = fixOverlayConfig(next.backOverlay, fallbackScale, fallbackPosition);
    if (back.changed) {
      next.backOverlay = back.config;
      changed = true;
    }
  }

  return { template: next, changed };
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(url, key);

const pageSize = 200;
let from = 0;
let scanned = 0;
let updated = 0;
let kept = 0;
const samples = [];

for (;;) {
  const { data, error } = await sb
    .from('managed_product_designs')
    .select('id, template, active, sort_order')
    .order('id', { ascending: true })
    .range(from, from + pageSize - 1);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const batch = data ?? [];
  if (batch.length === 0) break;

  for (const row of batch) {
    scanned += 1;
    const tpl = row.template;
    if (!tpl || typeof tpl !== 'object') continue;

    const before = tpl.overlayByProductType?.hoodie?.scale;
    const { template: fixed, changed } = fixTemplate(tpl);
    if (!changed) {
      if (supportsTeeAndHoodie(tpl) && typeof before === 'number') kept += 1;
      continue;
    }

    const after = fixed.overlayByProductType?.hoodie?.scale;
    updated += 1;
    if (samples.length < 12) {
      samples.push({
        id: row.id,
        title: tpl.titleEn || tpl.titleMk || tpl.nameKey,
        before,
        after,
      });
    }

    if (!DRY_RUN) {
      const { error: upsertError } = await sb
        .from('managed_product_designs')
        .upsert({
          id: row.id,
          template: fixed,
          active: row.active,
          sort_order: row.sort_order,
          updated_at: new Date().toISOString(),
        });
      if (upsertError) {
        console.error(`Failed ${row.id}:`, upsertError.message);
        process.exit(1);
      }
    }
  }

  if (batch.length < pageSize) break;
  from += pageSize;
}

console.log(
  JSON.stringify(
    {
      dryRun: DRY_RUN,
      scanned,
      updated,
      keptUserTuned: kept,
      samples,
    },
    null,
    2,
  ),
);
