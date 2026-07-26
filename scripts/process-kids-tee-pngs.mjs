import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const ASSETS = resolveCursorAssetsDir();
const OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/kids-generated');
const TARGET_LONG = 2400;

const FILES = [
  'kids-tee-01-dino-party.png',
  'kids-tee-02-panda-cake.png',
  'kids-tee-03-lion-gift.png',
  'kids-tee-04-bear-cake.png',
  'kids-tee-05-fox-balloon.png',
  'kids-tee-06-unicorn-party.png',
  'kids-tee-07-bunny-party.png',
  'kids-tee-08-kitten-gift.png',
  'kids-tee-09-puppy-balloon.png',
  'kids-tee-10-owl-party.png',
  'kids-tee-11-giraffe-party.png',
  'kids-tee-12-elephant-party.png',
];

function isBgCandidate(r, g, b, threshold, maxChroma) {
  const brightness = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness >= threshold && chroma <= maxChroma;
}

/**
 * Flood-fill near-white from image edges so interior white/cream fur stays opaque.
 */
async function removeWhiteBackground(inputPath, outputPath, { threshold = 242, maxChroma = 18 } = {}) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const pixels = Buffer.from(data);
  const visited = new Uint8Array(width * height);
  const stack = [];

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (!isBgCandidate(pixels[i], pixels[i + 1], pixels[i + 2], threshold, maxChroma)) return;
    visited[idx] = 1;
    stack.push(idx);
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const idx = stack.pop();
    const x = idx % width;
    const y = (idx / width) | 0;
    const i = idx * 4;
    pixels[i + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Soften only the outer ring of remaining near-white fringe (adjacent to transparent)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const i = idx * 4;
      if (pixels[i + 3] === 0) continue;
      if (!isBgCandidate(pixels[i], pixels[i + 1], pixels[i + 2], threshold - 8, maxChroma + 6)) {
        continue;
      }
      let nearClear = false;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const ni = ((y + dy) * width + (x + dx)) * 4;
        if (pixels[ni + 3] === 0) {
          nearClear = true;
          break;
        }
      }
      if (nearClear) {
        pixels[i + 3] = Math.round(pixels[i + 3] * 0.35);
      }
    }
  }

  const trimmedPng = await sharp(pixels, {
    raw: { width, height, channels: 4 },
  })
    .trim({ threshold: 10 })
    .png()
    .toBuffer();

  const trimmedMeta = await sharp(trimmedPng).metadata();
  const tw = trimmedMeta.width ?? TARGET_LONG;
  const th = trimmedMeta.height ?? TARGET_LONG;
  const longSide = Math.max(tw, th);
  const scale = longSide > 0 && longSide < TARGET_LONG ? TARGET_LONG / longSide : 1;

  let pipeline = sharp(trimmedPng);
  if (scale > 1) {
    pipeline = pipeline.resize({
      width: Math.round(tw * scale),
      height: Math.round(th * scale),
      kernel: sharp.kernel.lanczos3,
    });
  }

  await pipeline.png({ compressionLevel: 9, effort: 10 }).toFile(outputPath);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const name of FILES) {
    const input = path.join(ASSETS, name);
    if (!fs.existsSync(input)) {
      console.warn(`Skip missing: ${name}`);
      continue;
    }
    const output = path.join(OUT, name);
    await removeWhiteBackground(input, output);
    const meta = await sharp(output).metadata();
    const kb = Math.round(fs.statSync(output).size / 1024);
    console.log(
      `OK ${name} — ${meta.width}x${meta.height}, alpha=${!!meta.hasAlpha}, ${kb} KB`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
