/**
 * Process AI-generated design PNGs: white-bg removal, web + print exports.
 * Run: node scripts/process-ai-design-collections.mjs
 * Optional: node scripts/process-ai-design-collections.mjs --collection=stranger-80s
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS_DIR =
  process.env.DESIGN_ASSETS_DIR ??
  path.join(
    process.env.USERPROFILE ?? '',
    '.cursor',
    'projects',
    'h-print8-mk',
    'assets',
  );

const WEB_WIDTH = 1400;
const PRINT_WIDTH = 4500;

const manifestArg = process.argv.find((arg) => arg.startsWith('--manifest='));
const MANIFEST_PATH = manifestArg
  ? path.resolve(process.cwd(), manifestArg.split('=')[1])
  : path.join(process.cwd(), 'scripts/trending-collections-manifest.json');

async function removeNearWhiteBackground(buffer, options = {}) {
  const threshold = options.threshold ?? 252;
  const soft = options.soft ?? 10;
  const haloLum = options.haloLum ?? 236;
  const trimmed = await sharp(buffer)
    .trim({ threshold: 12, background: '#ffffff' })
    .toBuffer();

  const image = sharp(trimmed).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = data;
  const { width, height, channels } = info;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const lum = (r + g + b) / 3;

      if (min >= threshold) {
        pixels[i + 3] = 0;
        continue;
      }

      if (lum >= threshold - soft && max - min < 28) {
        const fade = Math.max(0, threshold - lum) / soft;
        pixels[i + 3] = Math.round(a * fade);
        continue;
      }

      // Remove white halo leaks on semi-transparent edge pixels.
      if (a > 0 && lum >= haloLum && max - min < 32) {
        pixels[i + 3] = 0;
      }
    }
  }

  return sharp(pixels, { raw: { width, height, channels } });
}

async function processItem(collection, item) {
  const sourcePath = path.join(ASSETS_DIR, item.asset);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`  missing ${item.asset}`);
    return false;
  }

  const webOut = path.join(process.cwd(), 'public/NEW_DESIGNS', collection);
  const masterOut = path.join(process.cwd(), 'print-masters', collection);
  fs.mkdirSync(webOut, { recursive: true });
  fs.mkdirSync(masterOut, { recursive: true });

  const file = `${item.out}.png`;
  const input = fs.readFileSync(sourcePath);
  const transparent = await removeNearWhiteBackground(input);

  await transparent
    .clone()
    .resize(WEB_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(path.join(webOut, file));

  await transparent
    .clone()
    .resize(PRINT_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(path.join(masterOut, file));

  return true;
}

const onlyCollection = process.argv
  .find((arg) => arg.startsWith('--collection='))
  ?.split('=')[1];

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
console.log(`Assets: ${ASSETS_DIR}`);

for (const col of manifest.collections) {
  if (onlyCollection && col.slug !== onlyCollection) continue;
  console.log(`\n${col.slug} (${col.items.length} items)`);
  let ok = 0;
  for (const item of col.items) {
    if (item.dual) {
      process.stdout.write(`  ${item.front.out} (front)… `);
      const frontOk = await processItem(col.slug, {
        asset: item.front.asset,
        out: item.front.out,
      });
      console.log(frontOk ? 'ok' : 'skip');
      if (frontOk) ok += 1;

      process.stdout.write(`  ${item.back.out} (back)… `);
      const backOk = await processItem(col.slug, {
        asset: item.back.asset,
        out: item.back.out,
      });
      console.log(backOk ? 'ok' : 'skip');
      if (backOk) ok += 1;
      continue;
    }

    process.stdout.write(`  ${item.out}… `);
    const success = await processItem(col.slug, item);
    console.log(success ? 'ok' : 'skip');
    if (success) ok += 1;
  }
  const expected = col.items.reduce(
    (n, item) => n + (item.dual ? 2 : 1),
    0,
  );
  console.log(`  → ${ok}/${expected} processed`);
}

console.log('\nDone.');
