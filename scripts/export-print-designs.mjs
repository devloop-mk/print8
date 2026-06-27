import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PRINT_WIDTH = 3600;
const PRINT_HEIGHT = 4500;
const printsDir = path.join(process.cwd(), 'public', 'product-designs', 'prints');

const files = await readdir(printsDir);
const svgs = files.filter((file) => file.endsWith('.svg'));

for (const file of svgs) {
  const input = path.join(printsDir, file);
  const output = path.join(printsDir, file.replace(/\.svg$/i, '.png'));

  await sharp(input, { density: 300 })
    .resize(PRINT_WIDTH, PRINT_HEIGHT, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(output);

  console.log(`Exported ${file} -> ${path.basename(output)}`);
}

console.log(`Done. ${svgs.length} print-ready PNG files.`);
