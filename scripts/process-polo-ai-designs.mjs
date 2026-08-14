/**
 * Process AI polo print artwork: flood-fill white background removal,
 * trim, upscale for print, write to public/NEW_DESIGNS/polo.
 *
 * Run: node scripts/process-polo-ai-designs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ASSETS_DIR = path.join(
  process.env.CURSOR_ASSETS_DIR ??
    path.join(process.env.USERPROFILE ?? '', '.cursor', 'projects', 'h-print8-mk', 'assets'),
);
const OUT_DIR = path.join(process.cwd(), 'public', 'NEW_DESIGNS', 'polo');

const DESIGNS = [
  {
    frontSrc: 'polo-ai-alpine-front-print.png',
    backSrc: 'polo-ai-alpine-back-print.png',
    frontOut: 'polo-ai-alpine-front.png',
    backOut: 'polo-ai-alpine-back.png',
    frontMinWidth: 2000,
    backMinWidth: 3200,
  },
  {
    frontSrc: 'polo-ai-urban-front-print.png',
    backSrc: 'polo-ai-urban-back-print.png',
    frontOut: 'polo-ai-urban-wave-front.png',
    backOut: 'polo-ai-urban-wave-back.png',
    frontMinWidth: 2000,
    backMinWidth: 3200,
  },
  {
    frontSrc: 'polo-ai-heritage-front-print.png',
    backSrc: 'polo-ai-heritage-back-print.png',
    frontOut: 'polo-ai-heritage-front.png',
    backOut: 'polo-ai-heritage-back.png',
    frontMinWidth: 2000,
    backMinWidth: 3200,
  },
];

function isBackgroundPixel(r, g, b, tolerance = 28) {
  return r >= 255 - tolerance && g >= 255 - tolerance && b >= 255 - tolerance;
}

function floodRemoveWhiteBackground(rgba, width, height) {
  const visited = new Uint8Array(width * height);
  const stack = [];

  function push(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const pi = y * width + x;
    if (visited[pi]) return;
    const i = pi * 4;
    if (!isBackgroundPixel(rgba[i], rgba[i + 1], rgba[i + 2])) return;
    visited[pi] = 1;
    rgba[i + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    push(x, y);
  }
}

async function processArtwork(srcPath, outPath, minWidth) {
  const input = await sharp(srcPath).ensureAlpha().png().toBuffer();
  const { data, info } = await sharp(input)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rgba = Uint8ClampedArray.from(data);
  floodRemoveWhiteBackground(rgba, info.width, info.height);

  let pipeline = sharp(Buffer.from(rgba), {
    raw: { width: info.width, height: info.height, channels: 4 },
  });

  const trimmed = await pipeline.png().toBuffer();
  pipeline = sharp(trimmed).trim();

  const trimmedMeta = await sharp(await pipeline.toBuffer()).metadata();
  const currentWidth = trimmedMeta.width ?? minWidth;
  if (currentWidth < minWidth) {
    pipeline = sharp(await pipeline.toBuffer()).resize({
      width: minWidth,
      fit: 'inside',
      withoutEnlargement: false,
    });
  }

  await pipeline.png({ compressionLevel: 6 }).toFile(outPath);
  const finalMeta = await sharp(outPath).metadata();
  console.log(
    `Wrote ${outPath} (${finalMeta.width}x${finalMeta.height}) from ${path.basename(srcPath)}`,
  );
}

async function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error(`Assets dir not found: ${ASSETS_DIR}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const design of DESIGNS) {
    const frontSrc = path.join(ASSETS_DIR, design.frontSrc);
    const backSrc = path.join(ASSETS_DIR, design.backSrc);
    if (!fs.existsSync(frontSrc)) throw new Error(`Missing ${frontSrc}`);
    if (!fs.existsSync(backSrc)) throw new Error(`Missing ${backSrc}`);

    await processArtwork(
      frontSrc,
      path.join(OUT_DIR, design.frontOut),
      design.frontMinWidth,
    );
    await processArtwork(
      backSrc,
      path.join(OUT_DIR, design.backOut),
      design.backMinWidth,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
