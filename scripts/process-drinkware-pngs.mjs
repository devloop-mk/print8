import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const ASSETS =
  process.env.DRINKWARE_RAW_DIR ?? resolveCursorAssetsDir();
const OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/drinkware');

const FILES = [
  { raw: 'mug-cheers-beer-raw.png', out: 'mug-cheers-beer.png' },
  { raw: 'mug-best-baba-raw.png', out: 'mug-best-baba.png' },
  { raw: 'mug-best-mom-raw.png', out: 'mug-best-mom.png' },
  { raw: 'mug-best-tetka-raw.png', out: 'mug-best-tetka.png' },
  { raw: 'mug-best-vujna-raw.png', out: 'mug-best-vujna.png' },
  { raw: 'mug-coffee-time-raw.png', out: 'mug-coffee-time.png' },
];

/** Turn near-white pixels transparent; preserve colored artwork. */
async function removeWhiteBackground(inputPath, outputPath, threshold = 248) {
  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      pixels[i + 3] = 0;
    }
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 10 })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const { raw, out } of FILES) {
    const input = path.join(ASSETS, raw);
    if (!fs.existsSync(input)) {
      console.warn(`Skip missing: ${raw}`);
      continue;
    }
    const output = path.join(OUT, out);
    await removeWhiteBackground(input, output);
    const meta = await sharp(output).metadata();
    const kb = Math.round(fs.statSync(output).size / 1024);
    console.log(`✓ ${out} — ${meta.width}×${meta.height}, ${kb} KB`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
