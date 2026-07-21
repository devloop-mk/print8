import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS = path.join(
  process.env.USERPROFILE ?? '',
  '.cursor/projects/c-Users-Viktor-Karabar-Desktop-print8-mk/assets',
);

const OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/bags');

const FILES = [
  { raw: 'tote-skopje-line-raw.png', out: 'tote-skopje-line.png' },
  { raw: 'tote-best-friends-raw.png', out: 'tote-best-friends.png' },
  { raw: 'tote-market-day-raw.png', out: 'tote-market-day.png' },
  { raw: 'tote-ohrid-lake-raw.png', out: 'tote-ohrid-lake.png' },
];

async function removeWhiteBackground(inputPath, outputPath, threshold = 245) {
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
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const item of FILES) {
    const input = path.join(ASSETS, item.raw);
    if (!fs.existsSync(input)) {
      console.warn(`Missing: ${item.raw}`);
      continue;
    }
    const output = path.join(OUT, item.out);
    await removeWhiteBackground(input, output);
    const meta = await sharp(output).metadata();
    const kb = Math.round(fs.statSync(output).size / 1024);
    console.log(`OK bags/${item.out} — ${meta.width}x${meta.height}, ${kb} KB, hasAlpha=${meta.hasAlpha}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
