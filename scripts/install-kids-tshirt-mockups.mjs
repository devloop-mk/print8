import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const assets = path.resolve(
  process.env.KIDS_MOCKUP_ASSETS ?? resolveCursorAssetsDir(),
);
const outDir = path.join(process.cwd(), 'public', 't-shirts', 'kids');
const slugs = ['nebesno-plava', 'zolta', 'mint'];

/** Replace neutral light-gray studio backgrounds with pure white (#FFFFFF). */
async function normalizeLightBackgroundToWhite(srcPath) {
  const image = sharp(srcPath);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });
  const { width, height, channels } = info;
  const out = Buffer.from(data);

  for (let i = 0; i < width * height; i++) {
    const idx = i * channels;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const isNeutral =
      Math.abs(r - g) < 18 &&
      Math.abs(g - b) < 18 &&
      Math.abs(r - b) < 18;
    const brightness = (r + g + b) / 3;
    if (isNeutral && brightness >= 175 && brightness <= 252) {
      out[idx] = 255;
      out[idx + 1] = 255;
      out[idx + 2] = 255;
      if (channels === 4) out[idx + 3] = 255;
    }
  }

  return sharp(out, { raw: { width, height, channels } });
}

async function processMockup(srcPath, destPath) {
  const pipeline = await normalizeLightBackgroundToWhite(srcPath);
  await pipeline
    .rotate()
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(destPath);
}

fs.mkdirSync(outDir, { recursive: true });

for (const slug of slugs) {
  for (const side of ['front', 'back']) {
    const src = path.join(assets, `kids-${slug}-${side}.png`);
    const dest = path.join(outDir, `${slug}-${side}.jpg`);
    if (!fs.existsSync(src)) {
      console.error(`Missing ${src}`);
      process.exitCode = 1;
      continue;
    }
    await processMockup(src, dest);
    console.log(`Wrote ${dest}`);
  }
}
