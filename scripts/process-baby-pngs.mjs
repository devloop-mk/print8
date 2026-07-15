import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS =
  process.env.BABY_RAW_DIR ??
  path.join(
    process.env.USERPROFILE ?? '',
    '.cursor/projects/c-Users-Viktor-Karabar-Desktop-print8-mk/assets',
  );
const OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/baby');

const FILES = [
  { raw: 'baby-mama-loading-raw.png', out: 'mama-loading-soon.png' },
  { raw: 'baby-first-easter-wreath-raw.png', out: 'first-easter-wreath.png' },
  { raw: 'baby-first-birthday-raw.png', out: 'first-birthday-bunny.png' },
  { raw: 'baby-first-easter-bunny-raw.png', out: 'first-easter-bunny.png' },
  { raw: 'baby-little-miracle-raw.png', out: 'little-miracle.png' },
  { raw: 'baby-hello-world-raw.png', out: 'hello-world.png' },
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
