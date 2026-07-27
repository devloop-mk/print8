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

const MANIFEST_PATH = path.join(
  process.cwd(),
  'scripts/trending-collections-manifest.json',
);

async function removeNearWhiteBackground(buffer, options = {}) {
  const threshold = options.threshold ?? 248;
  const soft = options.soft ?? 18;
  const image = sharp(buffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = data;
  const { width, height, channels } = info;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const min = Math.min(r, g, b);
      const max = Math.max(r, g, b);
      const lum = (r + g + b) / 3;

      if (min >= threshold) {
        pixels[i + 3] = 0;
        continue;
      }

      if (lum >= threshold - soft && max - min < 24) {
        const fade = Math.max(0, threshold - lum) / soft;
        pixels[i + 3] = Math.round(pixels[i + 3] * fade);
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
    process.stdout.write(`  ${item.out}… `);
    const success = await processItem(col.slug, item);
    console.log(success ? 'ok' : 'skip');
    if (success) ok += 1;
  }
  console.log(`  → ${ok}/${col.items.length} processed`);
}

console.log('\nDone.');
