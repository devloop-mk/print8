/**
 * Scan managed_product_designs for admin hoodie placement overrides.
 * Usage: node scripts/scan-hoodie-placements.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log('Missing Supabase env');
  process.exit(1);
}

const { createClient } = await import('@supabase/supabase-js');
const sb = createClient(url, key);

const { data, error } = await sb
  .from('managed_product_designs')
  .select('id, template, updated_at')
  .order('updated_at', { ascending: false });

if (error) {
  console.error(error.message);
  process.exit(1);
}

const custom = [];
const legacy = [];

for (const row of data ?? []) {
  const tpl = row.template;
  if (!tpl || typeof tpl !== 'object') continue;
  const types = tpl.productTypes ?? [];
  if (!types.includes('t-shirt') || !types.includes('hoodie')) continue;

  const baseScale = tpl.overlayScale ?? 40;
  const hoodie = tpl.overlayByProductType?.hoodie;
  if (!hoodie || typeof hoodie.scale !== 'number') continue;

  const legacyScale = Math.round(baseScale * (33 / 40));
  const entry = {
    id: row.id,
    title: tpl.titleEn || tpl.titleMk || tpl.nameKey,
    baseScale,
    hoodieScale: hoodie.scale,
    hoodieY: hoodie.position?.y,
    ratio: Number((hoodie.scale / baseScale).toFixed(3)),
    updated: row.updated_at,
  };

  if (hoodie.scale === legacyScale || hoodie.scale === 33) {
    legacy.push(entry);
  } else {
    custom.push(entry);
  }
}

const dist = {};
let brokenWings = null;
const userTuned = [];

for (const row of data ?? []) {
  const tpl = row.template;
  if (!tpl || typeof tpl !== 'object') continue;
  const types = tpl.productTypes ?? [];
  if (!types.includes('t-shirt') || !types.includes('hoodie')) continue;

  const baseScale = tpl.overlayScale ?? 40;
  const hoodie = tpl.overlayByProductType?.hoodie;
  if (!hoodie || typeof hoodie.scale !== 'number') continue;

  dist[hoodie.scale] = (dist[hoodie.scale] ?? 0) + 1;

  if (row.id === 'tee-sw-anime-048') {
    brokenWings = {
      scale: hoodie.scale,
      y: hoodie.position?.y,
      updated: row.updated_at,
    };
  }

  const legacyScale = Math.round(baseScale * (33 / 40));
  const isLegacy = hoodie.scale === legacyScale || hoodie.scale === 33;
  const updatedAt = Date.parse(row.updated_at);
  const recentlyTuned =
    Number.isFinite(updatedAt) && updatedAt >= Date.parse('2026-07-25T00:00:00Z');

  if (!isLegacy && hoodie.scale <= 32 && recentlyTuned) {
    userTuned.push({
      id: row.id,
      title: tpl.titleEn || tpl.titleMk,
      baseScale,
      hoodieScale: hoodie.scale,
      hoodieY: hoodie.position?.y,
      ratio: Number((hoodie.scale / baseScale).toFixed(3)),
    });
  }
}

const tunedScales = userTuned.map((r) => r.hoodieScale).sort((a, b) => a - b);
const avgTunedRatio =
  userTuned.length > 0
    ? userTuned.reduce((sum, r) => sum + r.ratio, 0) / userTuned.length
    : 0;

console.log(
  JSON.stringify(
    {
      totalManaged: data?.length ?? 0,
      customHoodieOverrides: custom.length,
      legacyPackOverrides: legacy.length,
      scaleDistribution: Object.entries(dist)
        .map(([scale, count]) => ({ scale: Number(scale), count }))
        .sort((a, b) => a.scale - b.scale),
      brokenWings,
      userTunedTodayCount: userTuned.length,
      userTunedScaleRange:
        tunedScales.length > 0
          ? { min: tunedScales[0], max: tunedScales[tunedScales.length - 1] }
          : null,
      userTunedMedian:
        tunedScales.length > 0
          ? tunedScales[Math.floor(tunedScales.length / 2)]
          : null,
      avgTunedRatio: Number(avgTunedRatio.toFixed(3)),
      userTunedSamples: userTuned.slice(0, 30),
    },
    null,
    2,
  ),
);
