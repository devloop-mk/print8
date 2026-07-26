import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const ASSETS =
  process.env.COUPLE_RAW_DIR ?? resolveCursorAssetsDir();
const OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/couple');

const FILES = [
  { raw: 'couple-king-raw.png', out: 'king.png' },
  { raw: 'couple-queen-raw.png', out: 'queen.png' },
  { raw: 'couple-hes-mine-raw.png', out: 'hes-mine.png' },
  { raw: 'couple-shes-mine-raw.png', out: 'shes-mine.png' },
  { raw: 'couple-puzzle-left-raw.png', out: 'puzzle-left.png' },
  { raw: 'couple-puzzle-right-raw.png', out: 'puzzle-right.png' },
  { raw: 'couple-magnet-holder-raw.png', out: 'magnet-holder.png' },
  { raw: 'couple-magnet-attracted-raw.png', out: 'magnet-attracted.png' },
  { raw: 'couple-mio-raw.png', out: 'mio.png' },
  { raw: 'couple-mia-raw.png', out: 'mia.png' },
  { raw: 'couple-pacman-raw.png', out: 'pacman.png' },
  { raw: 'couple-ghost-raw.png', out: 'ghost.png' },
];

async function removeWhiteBackground(inputPath, outputPath, threshold = 248) {
  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

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
    console.log(`OK ${out} — ${meta.width}x${meta.height}, ${kb} KB`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
