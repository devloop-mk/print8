/**
 * Normalize t-shirt design overlays to a shared chest placement.
 * Streetwear uses a fixed scale (consistent artwork). Other packs measure
 * visible content so padded PNGs don't look tiny next to full-bleed art.
 *
 * Usage:
 *   node scripts/normalize-tshirt-design-placement.mjs [--dry-run] [--db]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const DRY_RUN = process.argv.includes('--dry-run');
const UPDATE_DB = process.argv.includes('--db');

const TSHIRT_POSITION = { x: 50, y: 54 };
const STREETWEAR_SCALE = 40;
const TARGET_CONTENT_WIDTH_PCT = 38;
const MIN_SCALE = 28;
const MAX_SCALE = 44;
const HOODIE_POSITION = { x: 50, y: 59 };
const HOODIE_SCALE_RATIO = 0.82;
const FALLBACK_SCALE = 40;

const scaleCache = new Map();

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

function resolveOverlayFile(overlayImage) {
  if (!overlayImage || typeof overlayImage !== 'string') return null;
  if (/^https?:\/\//.test(overlayImage)) return null;
  const relative = overlayImage.replace(/^\//, '').split('?')[0];
  const candidate = path.join(ROOT, 'public', relative);
  return fs.existsSync(candidate) ? candidate : null;
}

async function measureContentWidthRatio(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .resize({ width: 320, withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  let minX = width;
  let maxX = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const alpha = channels >= 4 ? data[i + 3] : 255;
      if (alpha < 16) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 250 && g > 250 && b > 250) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
  }

  if (maxX < minX) return 0.95;
  return Math.min(1, Math.max(0.3, (maxX - minX + 1) / width));
}

function clampScale(scale) {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.round(scale)));
}

async function computeTshirtScale(overlayImage, { force } = {}) {
  if (force != null) return force;
  if (!overlayImage) return FALLBACK_SCALE;
  if (scaleCache.has(overlayImage)) return scaleCache.get(overlayImage);

  const file = resolveOverlayFile(overlayImage);
  let scale = FALLBACK_SCALE;
  if (file) {
    try {
      const fill = await measureContentWidthRatio(file);
      scale = clampScale(TARGET_CONTENT_WIDTH_PCT / fill);
    } catch {
      scale = FALLBACK_SCALE;
    }
  }
  scaleCache.set(overlayImage, scale);
  return scale;
}

function patchStreetwearPack() {
  const relative = 'src/lib/data/streetwear-pack.ts';
  const filePath = path.join(ROOT, relative);
  let source = fs.readFileSync(filePath, 'utf8');
  const before = source;

  source = source.replace(/overlayScale:\s*\d+/g, `overlayScale: ${STREETWEAR_SCALE}`);
  source = source.replace(
    /overlayPosition:\s*\{\s*x:\s*-?\d+(?:\.\d+)?,\s*y:\s*-?\d+(?:\.\d+)?\s*\}/g,
    `overlayPosition: { x: ${TSHIRT_POSITION.x}, y: ${TSHIRT_POSITION.y} }`,
  );
  const hoodieScale = clampScale(STREETWEAR_SCALE * HOODIE_SCALE_RATIO);
  source = source.replace(
    /hoodie:\s*\{\s*position:\s*\{\s*x:\s*-?\d+(?:\.\d+)?,\s*y:\s*-?\d+(?:\.\d+)?\s*\},\s*scale:\s*\d+\s*\}/g,
    `hoodie: { position: { x: ${HOODIE_POSITION.x}, y: ${HOODIE_POSITION.y} }, scale: ${hoodieScale} }`,
  );

  const changed = source !== before;
  if (!DRY_RUN && changed) fs.writeFileSync(filePath, source);
  console.log(
    `${relative}: ${changed ? `normalized to scale ${STREETWEAR_SCALE} @ (${TSHIRT_POSITION.x},${TSHIRT_POSITION.y})` : 'already normalized'}`,
  );
  return changed ? 1 : 0;
}

function extractDesignObjects(source) {
  const results = [];
  let i = 0;
  while (i < source.length) {
    const idAt = source.indexOf('id:', i);
    if (idAt < 0) break;

    let start = idAt;
    while (start > 0 && source[start] !== '{') start -= 1;
    if (source[start] !== '{') {
      i = idAt + 3;
      continue;
    }

    let depth = 0;
    let end = -1;
    let inStr = null;
    for (let j = start; j < source.length; j++) {
      const ch = source[j];
      const prev = j > 0 ? source[j - 1] : '';
      if (inStr) {
        if (ch === inStr && prev !== '\\') inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inStr = ch;
        continue;
      }
      if (ch === '{') depth += 1;
      if (ch === '}') {
        depth -= 1;
        if (depth === 0) {
          end = j + 1;
          break;
        }
      }
    }

    if (end < 0) break;
    const block = source.slice(start, end);
    if (block.includes('overlayImage') || block.includes('overlayScale')) {
      results.push({ start, end, block });
    }
    i = end;
  }
  return results;
}

function readFieldString(block, field) {
  return block.match(new RegExp(`${field}:\\s*['"]([^'"]+)['"]`))?.[1] ?? null;
}

function hasTshirtType(block) {
  const match = block.match(/productTypes:\s*\[([^\]]+)\]/);
  if (!match) return true;
  return match[1].includes('t-shirt');
}

function rewriteDesignBlock(block, scale) {
  let next = block;
  if (/overlayScale:\s*\d+/.test(next)) {
    next = next.replace(/overlayScale:\s*\d+/, `overlayScale: ${scale}`);
  }
  if (
    /overlayPosition:\s*\{\s*x:\s*-?\d+(?:\.\d+)?,\s*y:\s*-?\d+(?:\.\d+)?\s*\}/.test(
      next,
    )
  ) {
    next = next.replace(
      /overlayPosition:\s*\{\s*x:\s*-?\d+(?:\.\d+)?,\s*y:\s*-?\d+(?:\.\d+)?\s*\}/,
      `overlayPosition: { x: ${TSHIRT_POSITION.x}, y: ${TSHIRT_POSITION.y} }`,
    );
  }
  const hoodieScale = clampScale(scale * HOODIE_SCALE_RATIO);
  next = next.replace(
    /hoodie:\s*\{\s*position:\s*\{\s*x:\s*-?\d+(?:\.\d+)?,\s*y:\s*-?\d+(?:\.\d+)?\s*\},\s*scale:\s*\d+\s*\}/g,
    `hoodie: { position: { x: ${HOODIE_POSITION.x}, y: ${HOODIE_POSITION.y} }, scale: ${hoodieScale} }`,
  );
  next = next.replace(
    /(['"]t-shirt['"]):\s*\{\s*scale:\s*\d+,\s*position:\s*\{\s*x:\s*-?\d+(?:\.\d+)?,\s*y:\s*-?\d+(?:\.\d+)?\s*\}\s*\}/g,
    `$1: { scale: ${scale}, position: { x: ${TSHIRT_POSITION.x}, y: ${TSHIRT_POSITION.y} } }`,
  );
  next = next.replace(
    /(['"]t-shirt['"]):\s*\{\s*position:\s*\{\s*x:\s*-?\d+(?:\.\d+)?,\s*y:\s*-?\d+(?:\.\d+)?\s*\},\s*scale:\s*\d+\s*\}/g,
    `$1: { position: { x: ${TSHIRT_POSITION.x}, y: ${TSHIRT_POSITION.y} }, scale: ${scale} }`,
  );
  return next;
}

async function patchMeasuredPacks() {
  const files = [
    'src/lib/data/catalog.ts',
    'src/lib/data/baby-pack.ts',
    'src/lib/data/couple-pack.ts',
  ];
  let updated = 0;

  for (const relative of files) {
    const filePath = path.join(ROOT, relative);
    if (!fs.existsSync(filePath)) continue;
    const source = fs.readFileSync(filePath, 'utf8');
    const objects = extractDesignObjects(source);
    let output = '';
    let cursor = 0;

    for (const obj of objects) {
      output += source.slice(cursor, obj.start);
      let block = obj.block;
      if (hasTshirtType(block)) {
        const id = readFieldString(block, 'id');
        const overlayImage = readFieldString(block, 'overlayImage');
        const scale = await computeTshirtScale(overlayImage);
        const nextBlock = rewriteDesignBlock(block, scale);
        if (nextBlock !== block) {
          updated += 1;
          const oldScale = block.match(/overlayScale:\s*(\d+)/)?.[1];
          const oldY = block.match(/overlayPosition:\s*\{[^}]*y:\s*([^}\s,]+)/)?.[1];
          console.log(
            `${relative} ${id}: scale ${oldScale}→${scale}, y ${oldY}→${TSHIRT_POSITION.y}`,
          );
          block = nextBlock;
        }
      }
      output += block;
      cursor = obj.end;
    }
    output += source.slice(cursor);
    if (!DRY_RUN) fs.writeFileSync(filePath, output);
  }

  return updated;
}

function normalizeTemplate(template, scale) {
  const next = { ...template };
  next.overlayScale = scale;
  next.overlayPosition = { ...TSHIRT_POSITION };

  if (next.overlayByProductType && typeof next.overlayByProductType === 'object') {
    const byType = { ...next.overlayByProductType };
    if (byType['t-shirt']) {
      byType['t-shirt'] = {
        ...byType['t-shirt'],
        scale,
        position: { ...TSHIRT_POSITION },
      };
    }
    if (byType.hoodie) {
      byType.hoodie = {
        ...byType.hoodie,
        scale: clampScale(scale * HOODIE_SCALE_RATIO),
        position: { ...HOODIE_POSITION },
      };
    }
    next.overlayByProductType = byType;
  }

  return next;
}

async function patchManagedDatabase() {
  loadEnvLocal();
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('DB skip: missing Supabase env');
    return 0;
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('managed_product_designs')
    .select('id, template');
  if (error) throw new Error(error.message);

  let updated = 0;
  for (const row of data ?? []) {
    const template = row.template;
    const productTypes = template?.productTypes ?? [];
    if (
      productTypes.length > 0 &&
      !productTypes.includes('t-shirt') &&
      !productTypes.includes('hoodie')
    ) {
      continue;
    }

    const isStreetwear = String(row.id).startsWith('tee-sw-');
    const scale = await computeTshirtScale(template?.overlayImage, {
      force: isStreetwear ? STREETWEAR_SCALE : undefined,
    });
    const next = normalizeTemplate(template, scale);
    const sameScale = template.overlayScale === next.overlayScale;
    const samePos =
      template.overlayPosition?.x === next.overlayPosition.x &&
      template.overlayPosition?.y === next.overlayPosition.y;
    if (sameScale && samePos) continue;

    updated += 1;
    if (updated <= 30 || !isStreetwear) {
      console.log(
        `DB ${row.id}: scale ${template.overlayScale}→${next.overlayScale}, y ${template.overlayPosition?.y}→${next.overlayPosition.y}`,
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
  return updated;
}

console.log(
  `Normalizing t-shirt placement to (${TSHIRT_POSITION.x}, ${TSHIRT_POSITION.y})${DRY_RUN ? ' [dry-run]' : ''}`,
);

const streetwear = patchStreetwearPack();
const measured = await patchMeasuredPacks();
console.log(`Static: streetwear=${streetwear}, measured packs=${measured}`);

if (UPDATE_DB) {
  const dbUpdates = await patchManagedDatabase();
  console.log(`Database: ${dbUpdates} design(s) changed`);
} else {
  console.log('Database: skipped (pass --db)');
}
