/**
 * Process MK mug sublimation PNGs for classic mug print area.
 * Wrap designs → 1984×768 (matches drinkware unwrap texture).
 * Spot designs → white-bg removal + trim.
 *
 * Run: node scripts/process-mk-mugs.mjs
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

const MANIFEST_PATH = path.join(process.cwd(), 'scripts/mk-mugs-manifest.json');

/** Classic mug wrap texture size (see drinkware-3d-config.ts). */
const WRAP_WIDTH = 1984;
const WRAP_HEIGHT = 768;
const PRINT_WRAP_WIDTH = 3968;
const PRINT_WRAP_HEIGHT = 1536;

const SPOT_MAX = 1200;
const PRINT_SPOT_MAX = 2400;

async function removeNearWhiteBackground(buffer) {
  const trimmed = await sharp(buffer)
    .trim({ threshold: 12, background: '#ffffff' })
    .toBuffer();

  const image = sharp(trimmed).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = data;
  const { width, height, channels } = info;
  const threshold = 252;
  const soft = 10;
  const haloLum = 236;

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

      if (a > 0 && lum >= haloLum && max - min < 32) {
        pixels[i + 3] = 0;
      }
    }
  }

  return sharp(pixels, { raw: { width, height, channels } });
}

async function exportWrap(input, webPath, printPath) {
  await sharp(input)
    .resize(WRAP_WIDTH, WRAP_HEIGHT, {
      fit: 'cover',
      position: 'centre',
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(webPath);

  await sharp(input)
    .resize(PRINT_WRAP_WIDTH, PRINT_WRAP_HEIGHT, {
      fit: 'cover',
      position: 'centre',
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(printPath);
}

async function exportSpot(input, webPath, printPath) {
  const transparent = await removeNearWhiteBackground(input);

  await transparent
    .clone()
    .resize(SPOT_MAX, SPOT_MAX, {
      fit: 'inside',
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(webPath);

  await transparent
    .clone()
    .resize(PRINT_SPOT_MAX, PRINT_SPOT_MAX, {
      fit: 'inside',
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(printPath);
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  console.log(`Assets: ${ASSETS_DIR}`);

  for (const col of manifest.collections) {
    const webOut = path.join(process.cwd(), 'public/NEW_DESIGNS', col.slug);
    const masterOut = path.join(process.cwd(), 'print-masters', col.slug);
    fs.mkdirSync(webOut, { recursive: true });
    fs.mkdirSync(masterOut, { recursive: true });

    console.log(`\n${col.slug} (${col.items.length} items)`);
    let ok = 0;

    for (const item of col.items) {
      const sourcePath = path.join(ASSETS_DIR, item.asset);
      if (!fs.existsSync(sourcePath)) {
        console.warn(`  missing ${item.asset}`);
        continue;
      }

      const file = `${item.out}.png`;
      const webPath = path.join(webOut, file);
      const printPath = path.join(masterOut, file);
      const input = fs.readFileSync(sourcePath);

      process.stdout.write(`  ${item.out} (${item.layout})… `);

      if (item.layout === 'wrap') {
        await exportWrap(input, webPath, printPath);
      } else {
        await exportSpot(input, webPath, printPath);
      }

      const meta = await sharp(webPath).metadata();
      console.log(`ok — ${meta.width}x${meta.height}`);
      ok += 1;
    }

    console.log(`  → ${ok}/${col.items.length} processed`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
