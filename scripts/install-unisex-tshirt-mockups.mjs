import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const assets = path.resolve(
  process.env.UNISEX_MOCKUP_ASSETS ?? resolveCursorAssetsDir(),
);
const outDir = path.join(process.cwd(), 'public', 't-shirts', 'unisex');
const slugs = [
  'bela',
  'crna',
  'crvena',
  'teget',
  'zelena',
  'siva',
  'mastilo',
  'maslinova',
  'krem',
];

fs.mkdirSync(outDir, { recursive: true });

for (const slug of slugs) {
  for (const side of ['front', 'back']) {
    const src = path.join(assets, `${slug}-${side}.png`);
    const dest = path.join(outDir, `${slug}-${side}.jpg`);
    if (!fs.existsSync(src)) {
      console.error(`Missing ${src}`);
      process.exitCode = 1;
      continue;
    }
    await sharp(src).jpeg({ quality: 92, mozjpeg: true }).toFile(dest);
    console.log(`Wrote ${dest}`);
  }
}
