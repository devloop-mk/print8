/**
 * Recolors photographic white t-shirt mockups using multiply blend
 * (preserves folds) with a softened shirt mask.
 */

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { TSHIRT_UNISEX_COLORS } from '../src/lib/products/tshirt-unisex-colors';

const ROOT = path.join(process.cwd(), 'public', 't-shirts');
const OUT_DIR = path.join(ROOT, 'unisex');
const BASE_FRONT = path.join(ROOT, 'tshirt-white.jpg');
const BASE_BACK = path.join(ROOT, 'tshirt-white-back.jpg');

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function luminance(r: number, g: number, b: number) {
  return r * 0.299 + g * 0.587 + b * 0.114;
}

function isBackground(r: number, g: number, b: number) {
  return luminance(r, g, b) >= 251.5;
}

async function buildSoftMask(inputPath: string): Promise<Buffer> {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const mask = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < data.length; i += info.channels) {
    const pixel = i / info.channels;
    mask[pixel] = isBackground(data[i], data[i + 1], data[i + 2]) ? 0 : 255;
  }

  return sharp(mask, {
    raw: { width: info.width, height: info.height, channels: 1 },
  })
    .blur(0.8)
    .png()
    .toBuffer();
}

async function recolorMockup(
  inputPath: string,
  outputPath: string,
  hex: string,
) {
  const target = hexToRgb(hex);
  const mask = await buildSoftMask(inputPath);

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const recolored = Buffer.from(data);
  for (let i = 0; i < recolored.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isBackground(r, g, b)) continue;

    recolored[i] = Math.min(255, Math.round((target.r * r) / 255));
    recolored[i + 1] = Math.min(255, Math.round((target.g * g) / 255));
    recolored[i + 2] = Math.min(255, Math.round((target.b * b) / 255));
  }

  const shirtLayer = await sharp(recolored, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp(inputPath)
    .composite([{ input: shirtLayer, blend: 'over' }])
    .jpeg({ quality: 93, mozjpeg: true })
    .toFile(outputPath);
}

async function main() {
  for (const color of TSHIRT_UNISEX_COLORS) {
    await recolorMockup(
      BASE_FRONT,
      path.join(OUT_DIR, `${color.slug}-front.jpg`),
      color.hex,
    );
    await recolorMockup(
      BASE_BACK,
      path.join(OUT_DIR, `${color.slug}-back.jpg`),
      color.hex,
    );
    console.log(`Generated ${color.labelKey} (${color.hex})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
