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

async function detectBackgroundMode(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const samples = [];
  const sampleAt = (x, y) => {
    const i = (y * width + x) * channels;
    return (data[i] + data[i + 1] + data[i + 2]) / 3;
  };

  for (let x = 0; x < width; x += 1) {
    samples.push(sampleAt(x, 0), sampleAt(x, height - 1));
  }
  for (let y = 0; y < height; y += 1) {
    samples.push(sampleAt(0, y), sampleAt(width - 1, y));
  }

  const avg = samples.reduce((sum, lum) => sum + lum, 0) / samples.length;
  if (avg >= 220) return 'white';
  if (avg <= 40) return 'black';
  return avg < 128 ? 'black' : 'white';
}

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

function removeEdgeConnectedDark(pixels, width, height, channels, threshold = 26) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height * 2);
  let queueLength = 0;

  const isDark = (pixelIndex) => {
    const r = pixels[pixelIndex];
    const g = pixels[pixelIndex + 1];
    const b = pixels[pixelIndex + 2];
    return Math.max(r, g, b) <= threshold;
  };

  const push = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    const pixelIndex = idx * channels;
    if (!isDark(pixelIndex)) return;
    visited[idx] = 1;
    queue[queueLength++] = x;
    queue[queueLength++] = y;
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  let head = 0;
  while (head < queueLength) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = y * width + x;
    const pixelIndex = idx * channels;
    pixels[pixelIndex + 3] = 0;

    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }
}

async function removeNearBlackBackground(buffer, options = {}) {
  const threshold = options.threshold ?? 26;
  const soft = options.soft ?? 14;
  const trimmed = await sharp(buffer)
    .trim({ threshold: 10, background: { r: 0, g: 0, b: 0 } })
    .toBuffer();

  const image = sharp(trimmed).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = data;
  const { width, height, channels } = info;

  removeEdgeConnectedDark(pixels, width, height, channels, threshold);

  // Soft fade near-black pixels that touch transparent background (anti-halo).
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const i = idx * channels;
      const a = pixels[i + 3];
      if (a === 0) continue;

      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const max = Math.max(r, g, b);
      const lum = (r + g + b) / 3;
      if (max > threshold + soft) continue;

      let touchesTransparent = false;
      if (x > 0 && pixels[(idx - 1) * channels + 3] === 0) touchesTransparent = true;
      if (x < width - 1 && pixels[(idx + 1) * channels + 3] === 0) touchesTransparent = true;
      if (y > 0 && pixels[(idx - width) * channels + 3] === 0) touchesTransparent = true;
      if (y < height - 1 && pixels[(idx + width) * channels + 3] === 0) touchesTransparent = true;
      if (!touchesTransparent) continue;

      const fade = Math.max(0, lum - threshold) / soft;
      pixels[i + 3] = Math.round(a * fade);
    }
  }

  return sharp(pixels, { raw: { width, height, channels } });
}

async function removeBackground(buffer, mode = 'auto') {
  const resolvedMode =
    mode === 'auto' ? await detectBackgroundMode(buffer) : mode;

  if (resolvedMode === 'black') {
    return removeNearBlackBackground(buffer);
  }

  return removeNearWhiteBackground(buffer);
}

async function processItem(collectionSlug, item, options = {}) {
  const sourcePath = path.join(ASSETS_DIR, item.asset);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`  missing ${item.asset}`);
    return false;
  }

  const webOut = path.join(process.cwd(), 'public/NEW_DESIGNS', collectionSlug);
  const masterOut = path.join(process.cwd(), 'print-masters', collectionSlug);
  fs.mkdirSync(webOut, { recursive: true });
  fs.mkdirSync(masterOut, { recursive: true });

  const file = `${item.out}.png`;
  const input = fs.readFileSync(sourcePath);
  const backgroundMode = item.background ?? options.background ?? 'auto';
  const transparent = await removeBackground(input, backgroundMode);

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
      }, { background: col.background });
      console.log(frontOk ? 'ok' : 'skip');
      if (frontOk) ok += 1;

      process.stdout.write(`  ${item.back.out} (back)… `);
      const backOk = await processItem(col.slug, {
        asset: item.back.asset,
        out: item.back.out,
      }, { background: col.background });
      console.log(backOk ? 'ok' : 'skip');
      if (backOk) ok += 1;
      continue;
    }

    process.stdout.write(`  ${item.out}… `);
    const success = await processItem(col.slug, item, { background: col.background });
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
