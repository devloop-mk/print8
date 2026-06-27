import { readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PRINT_WIDTH = 3600;
const PRINT_HEIGHT = 4500;

async function exportDir(dir) {
  const files = await readdir(dir);
  const svgs = files.filter((file) => file.endsWith('.svg'));

  for (const file of svgs) {
    const input = path.join(dir, file);
    const output = path.join(dir, file.replace(/\.svg$/i, '.png'));

    await sharp(input, { density: 300 })
      .resize(PRINT_WIDTH, PRINT_HEIGHT, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toFile(output);

    console.log(`Exported ${path.relative(process.cwd(), output)}`);
  }
}

const root = path.join(process.cwd(), 'public', 'product-designs', 'prints');
await exportDir(path.join(root, 'keep-working-out'));
await exportDir(path.join(root, 'recolor'));
console.log('Variant PNG export complete.');
