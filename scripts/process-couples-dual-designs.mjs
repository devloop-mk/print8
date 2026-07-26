import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const ASSETS = resolveCursorAssetsDir();
const OUT_COUPLE = path.join(process.cwd(), 'public/NEW_DESIGNS/couples-generated');
const OUT_DUAL = path.join(process.cwd(), 'public/NEW_DESIGNS/dual-side-generated');
const TARGET_LONG = 2400;

/**
 * Only fill missing catalog filenames from GenerateImage aliases.
 * Never overwrite an existing dest (canonical GenerateImage names win).
 */
const ALIASES = [
  ['couple-rival-mouse-raw.png', 'couple-mouse-partner.png'],
  ['couple-soulmate-pair-raw.png', 'couple-soulmates.png'],
  ['dual-gaze-back-raw.png', 'dual-back-eye-panels.png'],
  ['dual-spark-back-raw.png', 'dual-back-storm-hero.png'],
  ['dual-ronin-back-raw.png', 'dual-back-blade-warrior.png'],
];

const JOBS = [
  { src: 'couple-fox-partner.png', outDir: OUT_COUPLE, out: 'couple-fox-partner.png', mode: 'white', thr: 242 },
  { src: 'couple-mouse-partner.png', outDir: OUT_COUPLE, out: 'couple-mouse-partner.png', mode: 'white', thr: 242 },
  { src: 'couple-soulmates.png', outDir: OUT_COUPLE, out: 'couple-soulmates.png', mode: 'white', thr: 242 },
  { src: 'dual-front-rogue-marks.png', outDir: OUT_DUAL, out: 'dual-front-rogue-marks.png', mode: 'black', thr: 28 },
  { src: 'dual-back-eye-panels.png', outDir: OUT_DUAL, out: 'dual-back-eye-panels.png', mode: 'white', thr: 230, globalWhite: true },
  { src: 'dual-front-storm-mark.png', outDir: OUT_DUAL, out: 'dual-front-storm-mark.png', mode: 'white', thr: 245 },
  { src: 'dual-back-storm-hero.png', outDir: OUT_DUAL, out: 'dual-back-storm-hero.png', mode: 'white', thr: 245 },
  { src: 'dual-front-blade-mark.png', outDir: OUT_DUAL, out: 'dual-front-blade-mark.png', mode: 'white', thr: 245 },
  { src: 'dual-back-blade-warrior.png', outDir: OUT_DUAL, out: 'dual-back-blade-warrior.png', mode: 'white', thr: 245 },
];

function isWhiteBg(r, g, b, threshold, maxChroma) {
  const brightness = (r + g + b) / 3;
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness >= threshold && chroma <= maxChroma;
}

function isBlackBg(r, g, b, threshold) {
  return r <= threshold && g <= threshold && b <= threshold;
}

async function removeBackground(
  inputPath,
  outputPath,
  { mode = 'white', threshold = 242, maxChroma = 18, globalWhite = false } = {},
) {
  const meta = await sharp(inputPath).metadata();
  const long = Math.max(meta.width ?? 1, meta.height ?? 1);
  const scale = long < TARGET_LONG ? TARGET_LONG / long : 1;
  const width = Math.round((meta.width ?? 1) * scale);
  const height = Math.round((meta.height ?? 1) * scale);

  const { data, info } = await sharp(inputPath)
    .resize(width, height, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h } = info;
  const pixels = Buffer.from(data);
  const visited = new Uint8Array(w * h);
  const stack = [];

  const isBg = (r, g, b) =>
    mode === 'black'
      ? isBlackBg(r, g, b, threshold)
      : isWhiteBg(r, g, b, threshold, maxChroma);

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (!isBg(pixels[i], pixels[i + 1], pixels[i + 2])) return;
    visited[idx] = 1;
    stack.push(idx);
  };

  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }

  while (stack.length) {
    const idx = stack.pop();
    const x = idx % w;
    const y = (idx / w) | 0;
    const i = idx * 4;
    pixels[i + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  // Eye-panel stacks need interior white gutters cleared (opt-in only)
  if (globalWhite && mode === 'white') {
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] === 0) continue;
      if (isWhiteBg(pixels[i], pixels[i + 1], pixels[i + 2], 235, 25)) {
        pixels[i + 3] = 0;
      }
    }
  }

  const trimmedPng = await sharp(pixels, {
    raw: { width: w, height: h, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png()
    .toBuffer();

  await sharp(trimmedPng)
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath);
}

for (const [from, to] of ALIASES) {
  const src = path.join(ASSETS, from);
  const dest = path.join(ASSETS, to);
  if (fs.existsSync(src) && !fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log('ALIAS', from, '->', to);
  }
}

fs.mkdirSync(OUT_COUPLE, { recursive: true });
fs.mkdirSync(OUT_DUAL, { recursive: true });

const only = process.argv[2]; // optional single out filename

for (const job of JOBS) {
  if (only && job.out !== only) continue;
  const input = path.join(ASSETS, job.src);
  const output = path.join(job.outDir, job.out);
  if (!fs.existsSync(input)) {
    console.error('MISSING', input);
    continue;
  }
  await removeBackground(input, output, {
    mode: job.mode,
    threshold: job.thr,
    globalWhite: job.globalWhite,
  });
  const st = fs.statSync(output);
  const meta = await sharp(output).metadata();
  console.log(
    'OK',
    job.out,
    `${meta.width}x${meta.height}`,
    `alpha=${!!meta.hasAlpha}`,
    `${Math.round(st.size / 1024)}KB`,
  );
}
