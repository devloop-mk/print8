/**
 * Compare mug mockup fill metrics.
 * Colored mugs use a near-white color threshold; white mugs also use Sobel edges
 * because ceramic-on-white is nearly invisible to simple thresholds.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'public/mugs');
const files = [
  'mug-white-classic.jpg',
  'mug-white-classic.backup.jpg',
  'mug-white-classic.pre-v2.jpg',
  'mug-white-classic-v2.jpg',
  'mug-milkyblue.jpg',
  'mug-black.jpg',
];

function isWhiteMug(file) {
  return /white/i.test(file);
}

async function measure(file) {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) return { file, missing: true };
  const meta = await sharp(full).metadata();
  const { data, info } = await sharp(full)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const ch = info.channels;
  const white = isWhiteMug(file);

  let lum = null;
  if (white) {
    lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const o = i * ch;
      lum[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    }
  }

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      let subject = false;
      if (a >= 8) {
        if (white) {
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const notFlatBg = !(maxC >= 252 && minC >= 250 && maxC - minC <= 4);
          let edge = false;
          if (lum && x > 0 && y > 0 && x < w - 1 && y < h - 1) {
            const li = y * w + x;
            const gx =
              -lum[li - w - 1] -
              2 * lum[li - 1] -
              lum[li + w - 1] +
              lum[li - w + 1] +
              2 * lum[li + 1] +
              lum[li + w + 1];
            const gy =
              -lum[li - w - 1] -
              2 * lum[li - w] -
              lum[li - w + 1] +
              lum[li + w - 1] +
              2 * lum[li + w] +
              lum[li + w + 1];
            edge = Math.hypot(gx, gy) >= 14;
          }
          subject = notFlatBg || edge;
        } else {
          // Colored mugs sit on slightly off-white (#f8–#fb) — thr 245 works.
          subject = !(r >= 245 && g >= 245 && b >= 245);
        }
      }

      if (subject) {
        found = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!found) {
    return { file, w: meta.width, h: meta.height, fillW: 0, fillH: 0 };
  }

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  return {
    file,
    bytes: fs.statSync(full).size,
    canvas: `${meta.width}x${meta.height}`,
    box: `${boxW}x${boxH}`,
    fillW: +((boxW / info.width) * 100).toFixed(1),
    fillH: +((boxH / info.height) * 100).toFixed(1),
    top: minY,
    bottom: info.height - 1 - maxY,
    left: minX,
    right: info.width - 1 - maxX,
    method: white ? 'edge+luma' : 'thr245',
  };
}

for (const f of files) {
  console.log(JSON.stringify(await measure(f)));
}
