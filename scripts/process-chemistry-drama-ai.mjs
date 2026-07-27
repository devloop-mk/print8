/**
 * Process AI-generated chemistry-drama PNGs: white-bg removal, web + print exports.
 * Run: node scripts/process-chemistry-drama-ai.mjs
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS_DIR =
  process.env.CHEMISTRY_DRAMA_ASSETS ??
  path.join(
    process.env.USERPROFILE ?? '',
    '.cursor',
    'projects',
    'h-print8-mk',
    'assets',
  );

const COLLECTION = 'chemistry-drama';
const WEB_OUT = path.join(process.cwd(), 'public/NEW_DESIGNS', COLLECTION);
const MASTER_OUT = path.join(process.cwd(), 'print-masters', COLLECTION);
const WEB_WIDTH = 1400;
const PRINT_WIDTH = 4500;

/** source filename in assets → output basename (without .png) */
const FILES = [
  { source: 'chemistry-drama-heisenberg-portrait.png', out: 'walter-heisenberg' },
  { source: 'chemistry-drama-jesse-portrait.png', out: 'jesse-pinkman' },
  { source: 'chemistry-drama-two-partners.png', out: 'walter-jesse-duo' },
  { source: 'chemistry-drama-lab-partners.png', out: 'lab-partners' },
  { source: 'chemistry-drama-br-ba.png', out: 'br-ba-elements' },
  { source: 'chemistry-drama-blue-crystals.png', out: 'blue-crystals' },
  { source: 'chemistry-drama-desert-rv.png', out: 'desert-rv' },
  { source: 'chemistry-drama-know-my-name.png', out: 'know-my-name' },
];

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

async function processFile(sourcePath, outBase) {
  const input = fs.readFileSync(sourcePath);
  const transparent = await removeNearWhiteBackground(input);
  const webPath = path.join(WEB_OUT, `${outBase}.png`);
  const masterPath = path.join(MASTER_OUT, `${outBase}.png`);

  await transparent
    .clone()
    .resize(WEB_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(webPath);

  await transparent
    .clone()
    .resize(PRINT_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: false,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(masterPath);

  const meta = await sharp(webPath).metadata();
  console.log(`  ${outBase}.png → ${meta.width}x${meta.height}`);
}

fs.mkdirSync(WEB_OUT, { recursive: true });
fs.mkdirSync(MASTER_OUT, { recursive: true });

console.log(`Assets: ${ASSETS_DIR}`);
for (const file of FILES) {
  const sourcePath = path.join(ASSETS_DIR, file.source);
  if (!fs.existsSync(sourcePath)) {
    console.warn(`Missing ${file.source}, skipping`);
    continue;
  }
  console.log(`Processing ${file.out}…`);
  await processFile(sourcePath, file.out);
}

console.log('Done.');
