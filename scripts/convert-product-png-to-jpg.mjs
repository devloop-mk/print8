import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const PRODUCT_DIRS = ['bags', 'caps', 'hoodies', 'mugs', 't-shirts', 'thermoses'];
const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 85;

const converted = [];

for (const dir of PRODUCT_DIRS) {
  const folder = path.join(PUBLIC_DIR, dir);
  if (!fs.existsSync(folder)) continue;

  for (const name of fs.readdirSync(folder)) {
    if (!name.toLowerCase().endsWith('.png')) continue;

    const pngPath = path.join(folder, name);
    const jpgPath = pngPath.replace(/\.png$/i, '.jpg');
    const before = fs.statSync(pngPath).size;
    const meta = await sharp(pngPath).metadata();

    if (meta.hasAlpha) {
      console.log(`skip (alpha): ${dir}/${name}`);
      continue;
    }

    await sharp(pngPath)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(jpgPath);

    fs.unlinkSync(pngPath);
    const after = fs.statSync(jpgPath).size;
    converted.push({
      from: `${dir}/${name}`,
      to: `${dir}/${path.basename(jpgPath)}`,
      before,
      after,
    });
  }
}

for (const row of converted) {
  console.log(
    `${row.from} -> ${row.to}: ${(row.before / 1024).toFixed(0)} KB -> ${(row.after / 1024).toFixed(0)} KB`,
  );
}

const saved = converted.reduce((sum, row) => sum + (row.before - row.after), 0);
console.log(
  `\nConverted ${converted.length} files, saved ${(saved / 1024).toFixed(0)} KB (${(saved / 1024 / 1024).toFixed(1)} MB).`,
);
