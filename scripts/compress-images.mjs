import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 82;
const LARGE_PNG_KB = 550;

async function compressFile(file) {
  const before = fs.statSync(file).size;
  const meta = await sharp(file).metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  const ext = path.extname(file).toLowerCase();

  let pipeline = sharp(file).rotate();
  let resized = false;

  if (longest > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });
    resized = true;
  }

  let buffer =
    ext === '.png'
      ? await pipeline
          .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
          .toBuffer()
      : await pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();

  if (
    ext === '.png' &&
    buffer.length / 1024 > LARGE_PNG_KB &&
    (resized || before / 1024 > LARGE_PNG_KB)
  ) {
    const aggressive = sharp(file).rotate().resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    const candidate = await aggressive
      .png({ compressionLevel: 9, effort: 10, adaptiveFiltering: true })
      .toBuffer();

    if (candidate.length < buffer.length) {
      buffer = candidate;
      resized = true;
    }
  }

  if (buffer.length >= before && !resized) {
    return null;
  }

  const tempPath = `${file}.tmp`;
  fs.writeFileSync(tempPath, buffer);
  fs.renameSync(tempPath, file);
  const after = fs.statSync(file).size;

  return {
    file: path.relative(PUBLIC_DIR, file),
    before,
    after,
    dimensions: `${meta.width}x${meta.height}`,
  };
}

async function walk(dir) {
  const results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walk(fullPath)));
    } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
      results.push(await compressFile(fullPath));
    }
  }

  return results;
}

const results = (await walk(PUBLIC_DIR)).filter(Boolean);
let saved = 0;

for (const row of results) {
  const delta = row.before - row.after;
  saved += delta;
  console.log(
    `${row.file}: ${(row.before / 1024).toFixed(0)} KB -> ${(row.after / 1024).toFixed(0)} KB (${row.dimensions})`,
  );
}

console.log(
  `\nCompressed ${results.length} files, saved ${(saved / 1024).toFixed(0)} KB (${(saved / 1024 / 1024).toFixed(1)} MB).`,
);
