import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS = path.join(
  process.env.USERPROFILE ?? '',
  '.cursor/projects/c-Users-Viktor-Karabar-Desktop-print8-mk/assets',
);
const OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/family');

const WHITE_BG_FILES = [
  { raw: 'family-newspaper-dad-raw.png', out: 'newspaper-dad.png' },
  { raw: 'family-newspaper-mom-raw.png', out: 'newspaper-mom.png' },
  { raw: 'family-newspaper-kid-raw.png', out: 'newspaper-kid.png' },
  { raw: 'family-newspaper-brother-raw.png', out: 'newspaper-brother.png' },
  { raw: 'family-newspaper-sister-raw.png', out: 'newspaper-sister.png' },
  { raw: 'family-newspaper-grandpa-raw.png', out: 'newspaper-grandpa.png' },
  { raw: 'family-newspaper-grandma-raw.png', out: 'newspaper-grandma.png' },
  { raw: 'family-stack-tato-raw.png', out: 'stack-tato.png' },
  { raw: 'family-stack-baba-raw.png', out: 'stack-baba.png' },
  { raw: 'family-stack-deda-raw.png', out: 'stack-deda.png' },
  { raw: 'family-stack-kid-raw.png', out: 'stack-kid.png' },
];

const BLACK_BG_FILES = [
  { raw: 'family-stack-mama-raw.png', out: 'stack-mama.png' },
];

async function removeNearColorBackground(
  inputPath,
  outputPath,
  { mode = 'white', threshold = 248 } = {},
) {
  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (mode === 'white') {
      if (r >= threshold && g >= threshold && b >= threshold) {
        pixels[i + 3] = 0;
      }
    } else {
      if (r <= 255 - threshold && g <= 255 - threshold && b <= 255 - threshold) {
        pixels[i + 3] = 0;
      }
    }
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const { raw, out } of WHITE_BG_FILES) {
    const input = path.join(ASSETS, raw);
    if (!fs.existsSync(input)) {
      console.warn(`Skip missing: ${raw}`);
      continue;
    }
    const output = path.join(OUT, out);
    await removeNearColorBackground(input, output, { mode: 'white', threshold: 245 });
    const meta = await sharp(output).metadata();
    const kb = Math.round(fs.statSync(output).size / 1024);
    console.log(`OK ${out} — ${meta.width}x${meta.height}, ${kb} KB`);
  }

  for (const { raw, out } of BLACK_BG_FILES) {
    const input = path.join(ASSETS, raw);
    if (!fs.existsSync(input)) {
      console.warn(`Skip missing: ${raw}`);
      continue;
    }
    const output = path.join(OUT, out);
    await removeNearColorBackground(input, output, { mode: 'black', threshold: 245 });
    const meta = await sharp(output).metadata();
    const kb = Math.round(fs.statSync(output).size / 1024);
    console.log(`OK ${out} — ${meta.width}x${meta.height}, ${kb} KB (black-bg)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
