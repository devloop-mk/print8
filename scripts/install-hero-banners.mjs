import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const assets = resolveCursorAssetsDir();
const dest = path.resolve('public/banners');

const files = fs
  .readdirSync(assets)
  .filter((f) => /^banner-(desktop|mobile)-.+\.png$/i.test(f));

if (!files.length) {
  console.error('No banner assets found in', assets);
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });

for (const file of files) {
  const isMobile = file.includes('mobile');
  const width = isMobile ? 1080 : 1800;
  const height = isMobile ? 1620 : 1200;
  const out = path.join(dest, file);
  await sharp(path.join(assets, file))
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .png({ compressionLevel: 9 })
    .toFile(out);
  const meta = await sharp(out).metadata();
  console.log(`OK ${file} ${meta.width}x${meta.height}`);
}

console.log(`Installed ${files.length} banners -> ${dest}`);
