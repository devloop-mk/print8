import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Build catalog/customizer JPG mockups (1536×1024) for the FRUT Original Polo.
 *
 * Source photos (Fruit of the Loom SC63050 / 0632140) from Wordans model specs:
 * - front: assets.wordans.pl/.../1240880/1240880_original.jpg
 * - back:  img.netenders.com/@wordans/.../1240880/1240880_back_big.jpg
 */

const TARGET_W = 1536;
const TARGET_H = 1024;
const OUT_DIR = path.join(process.cwd(), 'public', 'polo');

/** Match unisex tee mockup garment fill (~93% of canvas height). */
const SUBJECT_HEIGHT_RATIO = 0.93;

const FRONT_SOURCE = path.join(OUT_DIR, 'polo-frut-original-white-front.jpg');
const BACK_SOURCE = path.join(OUT_DIR, 'polo-frut-original-white-back.jpg');
const FRONT_OUT = path.join(OUT_DIR, 'bela-front.jpg');
const BACK_OUT = path.join(OUT_DIR, 'bela-back.jpg');

async function buildMockupFromBuffer(sourceBuffer, outputPath) {
  const meta = await sharp(sourceBuffer).metadata();
  const srcW = meta.width ?? 1;
  const srcH = meta.height ?? 1;

  const targetSubjectH = Math.round(TARGET_H * SUBJECT_HEIGHT_RATIO);
  const scale = targetSubjectH / srcH;
  const resizedW = Math.round(srcW * scale);
  const resizedH = Math.round(srcH * scale);

  const resized = await sharp(sourceBuffer)
    .resize(resizedW, resizedH, { fit: 'inside' })
    .png()
    .toBuffer();

  const left = Math.round((TARGET_W - resizedW) / 2);
  const top = Math.round((TARGET_H - resizedH) / 2);

  await sharp({
    create: {
      width: TARGET_W,
      height: TARGET_H,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: resized, left, top }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outputPath);

  console.log('Wrote', outputPath, `${resizedW}x${resizedH} at ${left},${top}`);
}

if (!fs.existsSync(FRONT_SOURCE)) {
  throw new Error(`Missing front source: ${FRONT_SOURCE}`);
}
if (!fs.existsSync(BACK_SOURCE)) {
  throw new Error(`Missing back source: ${BACK_SOURCE}`);
}

await buildMockupFromBuffer(
  await sharp(FRONT_SOURCE).jpeg().toBuffer(),
  FRONT_OUT,
);
await buildMockupFromBuffer(
  await sharp(BACK_SOURCE).jpeg().toBuffer(),
  BACK_OUT,
);
