/**
 * Upscale flat print drafts to t-shirt print size (~15" @ 300 DPI).
 * Source AI drafts are 1024px; Lanczos + mild sharpen is best-effort
 * until true 4K generation is available.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = path.join(process.cwd(), 'designs-to-process');
const OUT = path.join(SRC, 'print-ready-4500');
/** 15" @ 300 DPI — common adult tee print canvas */
const TARGET = 4500;

fs.mkdirSync(OUT, { recursive: true });

const files = fs
  .readdirSync(SRC)
  .filter((name) => name.toLowerCase().endsWith('.png'));

for (const file of files) {
  const input = path.join(SRC, file);
  const output = path.join(OUT, file.replace(/\.png$/i, '-4500.png'));
  const meta = await sharp(input).metadata();
  console.log(`Upscaling ${file} (${meta.width}x${meta.height}) → ${TARGET}x${TARGET}`);

  await sharp(input)
    .resize(TARGET, TARGET, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      kernel: sharp.kernel.lanczos3,
    })
    .sharpen({ sigma: 0.8, m1: 0.6, m2: 0.3 })
    .png({ compressionLevel: 6, adaptiveFiltering: true })
    .toFile(output);

  const outMeta = await sharp(output).metadata();
  const kb = Math.round(fs.statSync(output).size / 1024);
  console.log(`  wrote ${path.basename(output)} ${outMeta.width}x${outMeta.height} (${kb} KB)`);
}

console.log(`Done → ${OUT}`);
